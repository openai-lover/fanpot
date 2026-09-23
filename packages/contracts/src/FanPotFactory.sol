// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {FanPotCampaign} from "./FanPotCampaign.sol";
import {IFanPotCampaign} from "./IFanPotCampaign.sol";

contract FanPotFactory is Ownable2Step {
    address public immutable reviewer;
    address public immutable usdc;
    mapping(address => bool) public organizerAllowed;
    mapping(address => bool) public isCampaign;
    mapping(address => mapping(bytes32 => bool)) public usedDraftRef;
    error InvalidConfig(); error Unauthorized(); error DuplicateDraftRef();
    event CampaignCreated(address indexed campaign, address indexed organizer, bytes32 indexed draftRef, bytes32 rulesHash);
    event OrganizerAllowed(address indexed organizer, bool allowed);
    constructor(address owner_, address fixedReviewer, address usdc_) Ownable(owner_) {
        if (fixedReviewer == address(0) || usdc_ == address(0)) revert InvalidConfig();
        try IERC20Metadata(usdc_).decimals() returns (uint8 decimals_) {
            if (decimals_ != 6) revert InvalidConfig();
        } catch { revert InvalidConfig(); }
        reviewer = fixedReviewer; usdc = usdc_;
    }
    function setOrganizerAllowed(address organizer, bool allowed) external onlyOwner {
        if (organizer == address(0) || organizer == reviewer) revert InvalidConfig();
        organizerAllowed[organizer] = allowed;
        emit OrganizerAllowed(organizer, allowed);
    }
    function createCampaign(uint256 goal, uint64 deadline, bytes32 rulesHash,
        IFanPotCampaign.AllocationInput[] calldata allocations, bytes32 draftRef) external returns (address campaign) {
        if (!organizerAllowed[msg.sender]) revert Unauthorized();
        if (draftRef == bytes32(0)) revert InvalidConfig();
        if (usedDraftRef[msg.sender][draftRef]) revert DuplicateDraftRef();
        // Validate before uint64 arithmetic and before invoking the new campaign.
        if (deadline <= block.timestamp || deadline > block.timestamp + 30 days) revert InvalidConfig();
        usedDraftRef[msg.sender][draftRef] = true;
        campaign = address(new FanPotCampaign(IFanPotCampaign.Config(msg.sender, reviewer, usdc,
            goal, deadline, uint64(uint256(deadline) + 14 days), rulesHash), allocations));
        isCampaign[campaign] = true;
        emit CampaignCreated(campaign, msg.sender, draftRef, rulesHash);
    }
}
