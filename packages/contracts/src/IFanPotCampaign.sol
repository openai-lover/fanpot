// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IFanPotCampaign {
    enum Phase { Ready, Funding, Successful, Paying, Refunding, Closed }
    enum Outcome { Undecided, Successful, Failed, Cancelled }
    enum AllocationStatus { Unrequested, Requested, Paid, Skipped }
    enum SettlementReason { None, GoalFailed, Stopped, BudgetResolved, TimedOut }
    struct Config {
        address organizer; address reviewer; address usdc; uint256 goal;
        uint64 deadline; uint64 settleBy; bytes32 rulesHash;
    }
    struct AllocationInput { address recipient; uint256 cap; bytes32 purposeHash; }
    struct AllocationView {
        address recipient; uint256 cap; bytes32 purposeHash; AllocationStatus status;
        uint256 requestedAmount; bytes32 evidenceHash;
    }
    struct Summary {
        Phase phase; Outcome outcome; SettlementReason settlementReason;
        uint256 totalContributed; uint256 totalPaid; uint256 refundPool;
        uint256 totalRefunded; uint256 supporterCount; uint256 claimedCount; uint256 accountedBalance;
    }
    error Unauthorized(); error InvalidConfig(); error InvalidState(); error NotReady();
    error DeadlinePassed(); error SettlementExpired(); error InvalidAmount();
    error GoalCapacityExceeded(); error WalletCapExceeded(); error DuplicateClientRef();
    error InvalidAllocation(); error AlreadyResolved(); error RequestMismatch();
    error NoContribution(); error AlreadyClaimed(); error UnexpectedTokenDelta();
    error NativeTransferNotSupported();

    event Activated(uint64 timestamp);
    event Contributed(address indexed supporter, uint256 amount, bytes32 clientRef, uint256 totalContributed, uint256 supporterOrdinal);
    event FundingFinalized(Outcome outcome, uint256 totalContributed);
    event PayoutRequested(uint8 indexed index, uint256 amount, bytes32 evidenceHash);
    event PayoutExecuted(uint8 indexed index, address indexed recipient, uint256 amount, bytes32 evidenceHash);
    event AllocationSkipped(uint8 indexed index);
    event RefundsOpened(uint256 refundPool, uint256 totalContributed, SettlementReason reason);
    event RefundClaimed(address indexed supporter, uint256 amount, address indexed caller);
    event Closed(uint256 roundingRemainder);

    function activate() external;
    function contribute(uint256 amount, bytes32 clientRef) external;
    function finalize() external returns (Phase);
    function requestPayout(uint8 index, uint256 amount, bytes32 evidenceHash) external;
    function approveAndPay(uint8 index, uint256 expectedAmount, bytes32 expectedEvidenceHash) external;
    function skipAllocation(uint8 index) external;
    function settle() external returns (Phase);
    function stop() external;
    function claimRefund() external;
    function claimRefundFor(address supporter) external;
    function getConfig() external view returns (Config memory);
    function getSummary() external view returns (Summary memory);
    function getAllocation(uint8 index) external view returns (AllocationView memory);
    function allocationCount() external view returns (uint256);
    function contributions(address supporter) external view returns (uint256);
    function supporterOrdinal(address supporter) external view returns (uint256);
    function claimed(address supporter) external view returns (bool);
    function claimable(address supporter) external view returns (uint256);
    function usedClientRefs(address supporter, bytes32 clientRef) external view returns (bool);
}
