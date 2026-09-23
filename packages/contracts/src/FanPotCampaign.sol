// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IFanPotCampaign} from "./IFanPotCampaign.sol";

/// @notice Fixed-budget, non-upgradeable campaign. All values are USDC micro-units.
/// @dev No sweep, admin override, arbitrary call, fee, or mutable configuration.
contract FanPotCampaign is IFanPotCampaign, ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint256 public constant MIN_CONTRIBUTION = 100_000;
    uint256 public constant WALLET_CAP = 20_000_000;
    address public immutable organizer;
    address public immutable reviewer;
    IERC20 public immutable usdc;
    uint256 public immutable goal;
    uint64 public immutable deadline;
    uint64 public immutable settleBy;
    bytes32 public immutable rulesHash;
    Phase public phase;
    Outcome public outcome;
    SettlementReason public settlementReason;
    uint256 public totalContributed;
    uint256 public totalPaid;
    uint256 public refundPool;
    uint256 public totalRefunded;
    uint256 public supporterCount;
    uint256 public claimedCount;
    mapping(address => uint256) public contributions;
    mapping(address => uint256) public supporterOrdinal;
    mapping(address => bool) public claimed;
    mapping(address => mapping(bytes32 => bool)) public usedClientRefs;
    AllocationView[] private allocations;

    constructor(Config memory config, AllocationInput[] memory inputs) {
        if (config.organizer == address(0) || config.reviewer == address(0) || config.usdc == address(0)
            || config.organizer == config.reviewer || config.goal < 1_000_000 || config.goal > 100_000_000
            || config.deadline <= block.timestamp || config.deadline > block.timestamp + 30 days
            || uint256(config.settleBy) != uint256(config.deadline) + 14 days || config.rulesHash == bytes32(0)
            || inputs.length == 0 || inputs.length > 3) revert InvalidConfig();
        try IERC20Metadata(config.usdc).decimals() returns (uint8 decimals_) {
            if (decimals_ != 6) revert InvalidConfig();
        } catch { revert InvalidConfig(); }
        organizer = config.organizer; reviewer = config.reviewer; usdc = IERC20(config.usdc);
        goal = config.goal; deadline = config.deadline; settleBy = config.settleBy; rulesHash = config.rulesHash;
        uint256 caps;
        for (uint256 i; i < inputs.length; ++i) {
            AllocationInput memory a = inputs[i];
            if (a.recipient == address(0) || a.recipient == config.organizer || a.recipient == config.reviewer
                || a.recipient == address(this) || a.cap == 0 || a.cap > config.goal || a.purposeHash == bytes32(0)) revert InvalidConfig();
            caps += a.cap;
            allocations.push(AllocationView(a.recipient, a.cap, a.purposeHash, AllocationStatus.Unrequested, 0, bytes32(0)));
        }
        if (caps > config.goal) revert InvalidConfig();
    }

    modifier onlyRoles() {
        if (msg.sender != organizer && msg.sender != reviewer) revert Unauthorized();
        _;
    }

    function activate() external nonReentrant {
        if (msg.sender != reviewer) revert Unauthorized();
        if (phase != Phase.Ready) revert InvalidState();
        if (uint256(deadline) < block.timestamp + 1 days) revert NotReady();
        phase = Phase.Funding;
        emit Activated(uint64(block.timestamp));
    }

    function contribute(uint256 amount, bytes32 clientRef) external nonReentrant {
        if (phase != Phase.Funding) revert InvalidState();
        if (block.timestamp >= deadline) revert DeadlinePassed();
        uint256 remaining = goal - totalContributed;
        if (amount == 0 || (amount < MIN_CONTRIBUTION && amount != remaining)) revert InvalidAmount();
        if (amount > remaining) revert GoalCapacityExceeded();
        if (amount > WALLET_CAP - contributions[msg.sender]) revert WalletCapExceeded();
        if (clientRef == bytes32(0)) revert InvalidConfig();
        if (usedClientRefs[msg.sender][clientRef]) revert DuplicateClientRef();
        uint256 beforeBalance = usdc.balanceOf(address(this));
        usedClientRefs[msg.sender][clientRef] = true;
        if (contributions[msg.sender] == 0) supporterOrdinal[msg.sender] = ++supporterCount;
        contributions[msg.sender] += amount;
        totalContributed += amount;
        // Commit the full state before the token call. A failed transfer rolls it all back.
        bool reachedGoal = totalContributed == goal;
        if (reachedGoal) { phase = Phase.Successful; outcome = Outcome.Successful; }
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterBalance = usdc.balanceOf(address(this));
        if (afterBalance < beforeBalance || afterBalance - beforeBalance != amount) revert UnexpectedTokenDelta();
        emit Contributed(msg.sender, amount, clientRef, totalContributed, supporterOrdinal[msg.sender]);
        if (reachedGoal) emit FundingFinalized(outcome, totalContributed);
    }

    function finalize() external nonReentrant returns (Phase) {
        if (phase != Phase.Ready && phase != Phase.Funding) return phase;
        if (block.timestamp < deadline) revert NotReady();
        if (phase == Phase.Ready) {
            outcome = Outcome.Cancelled;
            emit FundingFinalized(outcome, totalContributed);
            _openRefunds(SettlementReason.Stopped);
        } else if (totalContributed == goal) {
            outcome = Outcome.Successful; phase = Phase.Successful;
            emit FundingFinalized(outcome, totalContributed);
        } else {
            outcome = Outcome.Failed;
            emit FundingFinalized(outcome, totalContributed);
            _openRefunds(SettlementReason.GoalFailed);
        }
        return phase;
    }

    function requestPayout(uint8 index, uint256 amount, bytes32 evidenceHash) external nonReentrant {
        if (msg.sender != organizer) revert Unauthorized();
        _requirePayingWindow();
        AllocationView storage a = _allocation(index);
        if (a.status != AllocationStatus.Unrequested) revert AlreadyResolved();
        if (amount == 0 || amount > a.cap || evidenceHash == bytes32(0)) revert InvalidAmount();
        a.status = AllocationStatus.Requested; a.requestedAmount = amount; a.evidenceHash = evidenceHash;
        emit PayoutRequested(index, amount, evidenceHash);
    }

    function approveAndPay(uint8 index, uint256 expectedAmount, bytes32 expectedEvidenceHash) external nonReentrant {
        if (msg.sender != reviewer) revert Unauthorized();
        _requirePayingWindow();
        AllocationView storage a = _allocation(index);
        if (a.status != AllocationStatus.Requested) revert InvalidState();
        if (a.requestedAmount != expectedAmount || a.evidenceHash != expectedEvidenceHash) revert RequestMismatch();
        a.status = AllocationStatus.Paid; totalPaid += a.requestedAmount; phase = Phase.Paying;
        usdc.safeTransfer(a.recipient, a.requestedAmount);
        emit PayoutExecuted(index, a.recipient, a.requestedAmount, a.evidenceHash);
    }

    function skipAllocation(uint8 index) external onlyRoles nonReentrant {
        _requirePayingWindow();
        AllocationView storage a = _allocation(index);
        if (a.status == AllocationStatus.Paid || a.status == AllocationStatus.Skipped) revert AlreadyResolved();
        a.status = AllocationStatus.Skipped;
        emit AllocationSkipped(index);
    }

    function settle() external nonReentrant returns (Phase) {
        if (phase == Phase.Refunding || phase == Phase.Closed) return phase;
        if (phase != Phase.Successful && phase != Phase.Paying) revert InvalidState();
        bool timedOut = block.timestamp >= settleBy;
        if (!timedOut) {
            for (uint256 i; i < allocations.length; ++i) {
                AllocationStatus status = allocations[i].status;
                if (status != AllocationStatus.Paid && status != AllocationStatus.Skipped) revert NotReady();
            }
        }
        _openRefunds(timedOut ? SettlementReason.TimedOut : SettlementReason.BudgetResolved);
        return phase;
    }

    function stop() external onlyRoles nonReentrant {
        if (phase == Phase.Refunding || phase == Phase.Closed) revert InvalidState();
        if (phase == Phase.Ready || phase == Phase.Funding) {
            outcome = Outcome.Cancelled;
            emit FundingFinalized(outcome, totalContributed);
        }
        _openRefunds(SettlementReason.Stopped);
    }

    function claimRefund() external nonReentrant { _claim(msg.sender); }
    function claimRefundFor(address supporter) external nonReentrant { _claim(supporter); }

    function _claim(address supporter) private {
        if (phase != Phase.Refunding) revert InvalidState();
        if (contributions[supporter] == 0) revert NoContribution();
        if (claimed[supporter]) revert AlreadyClaimed();
        uint256 amount = Math.mulDiv(contributions[supporter], refundPool, totalContributed);
        claimed[supporter] = true; ++claimedCount; totalRefunded += amount;
        bool last = claimedCount == supporterCount;
        if (last) phase = Phase.Closed;
        if (amount != 0) usdc.safeTransfer(supporter, amount);
        emit RefundClaimed(supporter, amount, msg.sender);
        if (last) emit Closed(refundPool - totalRefunded);
    }

    function _openRefunds(SettlementReason reason) private {
        settlementReason = reason;
        refundPool = totalContributed - totalPaid;
        phase = refundPool == 0 ? Phase.Closed : Phase.Refunding;
        emit RefundsOpened(refundPool, totalContributed, reason);
        if (phase == Phase.Closed) emit Closed(0);
    }
    function _requirePayingWindow() private view {
        if (outcome != Outcome.Successful || (phase != Phase.Successful && phase != Phase.Paying)) revert InvalidState();
        if (block.timestamp >= settleBy) revert SettlementExpired();
    }
    function _allocation(uint8 index) private view returns (AllocationView storage) {
        if (index >= allocations.length) revert InvalidAllocation();
        return allocations[index];
    }
    function claimable(address supporter) external view returns (uint256) {
        if (phase != Phase.Refunding || claimed[supporter] || contributions[supporter] == 0) return 0;
        return Math.mulDiv(contributions[supporter], refundPool, totalContributed);
    }
    function getConfig() external view returns (Config memory) {
        return Config(organizer, reviewer, address(usdc), goal, deadline, settleBy, rulesHash);
    }
    function getSummary() external view returns (Summary memory) {
        return Summary(phase, outcome, settlementReason, totalContributed, totalPaid, refundPool,
            totalRefunded, supporterCount, claimedCount, totalContributed - totalPaid - totalRefunded);
    }
    function getAllocation(uint8 index) external view returns (AllocationView memory) { return _allocation(index); }
    function allocationCount() external view returns (uint256) { return allocations.length; }
    receive() external payable { revert NativeTransferNotSupported(); }
    fallback() external payable { revert NativeTransferNotSupported(); }
}
