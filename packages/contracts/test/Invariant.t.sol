// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BaseTest, I, FanPotCampaign, MockUSDC} from "./Base.t.sol";
import {Test} from "forge-std/Test.sol";

contract CampaignHandler is Test {
    FanPotCampaign public campaign;
    MockUSDC public token;
    address[] public actors;
    uint256 public refCounter;
    uint256 public frozenPool;
    bool public hasSettled;
    mapping(address => uint256) public ghostContributions;
    mapping(address => uint256) public ghostRefunds;
    bytes32 private constant EVIDENCE = keccak256("redacted invariant evidence");
    constructor(FanPotCampaign c, MockUSDC t) {
        campaign = c; token = t;
        for (uint160 i = 1; i <= 8; ++i) actors.push(address(0x1000 + i));
    }
    function contribute(uint256 actorSeed, uint256 amountSeed) external {
        address actor = actors[actorSeed % actors.length];
        uint256 remaining = campaign.goal() - campaign.totalContributed();
        if (remaining == 0) return;
        uint256 amount = bound(amountSeed, 1, remaining);
        token.mint(actor, amount);
        vm.startPrank(actor); token.approve(address(campaign), amount);
        try campaign.contribute(amount, bytes32(++refCounter)) { ghostContributions[actor] += amount; } catch {}
        vm.stopPrank();
    }
    function request(uint256 amountSeed) external {
        uint256 amount = bound(amountSeed, 1, campaign.getAllocation(0).cap);
        vm.prank(campaign.organizer()); try campaign.requestPayout(0, amount, EVIDENCE) {} catch {}
    }
    function pay() external {
        uint256 amount = campaign.getAllocation(0).requestedAmount;
        vm.prank(campaign.reviewer()); try campaign.approveAndPay(0, amount, EVIDENCE) {} catch {}
    }
    function skip() external { vm.prank(campaign.organizer()); try campaign.skipAllocation(0) {} catch {} }
    function stop(uint256 seed) external {
        // Delay most stops to exercise successful payouts as well as cancellations.
        if (seed % 16 != 0) return;
        vm.prank(campaign.reviewer()); try campaign.stop() {} catch {} _observeSettlement();
    }
    function advanceTime(uint256 secondsSeed) external { vm.warp(block.timestamp + bound(secondsSeed, 0, 2 days)); }
    function finalize() external { try campaign.finalize() {} catch {} _observeSettlement(); }
    function settle() external { try campaign.settle() {} catch {} _observeSettlement(); }
    function donate(uint256 seed) external { token.mint(address(campaign), bound(seed, 0, 100e6)); }
    function claim(uint256 actorSeed) external {
        address actor = actors[actorSeed % actors.length];
        uint256 beforeBalance = token.balanceOf(actor);
        try campaign.claimRefundFor(actor) { ghostRefunds[actor] += token.balanceOf(actor) - beforeBalance; } catch {}
    }
    function _observeSettlement() private {
        if (!hasSettled && (campaign.phase() == I.Phase.Refunding || campaign.phase() == I.Phase.Closed)) {
            hasSettled = true; frozenPool = campaign.refundPool();
        }
    }
}

contract InvariantTest is BaseTest {
    CampaignHandler internal handler;
    function setUp() public override {
        super.setUp(); activate(); handler = new CampaignHandler(campaign, token);
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = handler.contribute.selector; selectors[1] = handler.request.selector;
        selectors[2] = handler.pay.selector; selectors[3] = handler.skip.selector; selectors[4] = handler.stop.selector;
        selectors[5] = handler.advanceTime.selector; selectors[6] = handler.finalize.selector;
        selectors[7] = handler.settle.selector; selectors[8] = handler.donate.selector; selectors[9] = handler.claim.selector;
        targetSelector(FuzzSelector(address(handler), selectors)); targetContract(address(handler));
    }
    function invariantMoneyConservedAndRefundsOrderIndependent() public view {
        I.Summary memory s = campaign.getSummary();
        uint256 sum; uint256 count;
        for (uint256 i; i < 8; ++i) {
            address a = handler.actors(i); uint256 c = campaign.contributions(a);
            assertEq(c, handler.ghostContributions(a)); assertLe(c, 20e6); sum += c;
            if (c > 0) ++count;
            if (campaign.claimed(a)) {
                assertEq(handler.ghostRefunds(a), c * s.refundPool / s.totalContributed);
            } else { assertEq(handler.ghostRefunds(a), 0); }
        }
        assertEq(sum, s.totalContributed); assertEq(count, s.supporterCount);
        assertLe(s.totalContributed, campaign.goal()); assertLe(s.totalPaid, campaign.getAllocation(0).cap);
        assertLe(s.totalPaid + s.totalRefunded, s.totalContributed);
        assertEq(s.accountedBalance, s.totalContributed - s.totalPaid - s.totalRefunded);
        assertGe(token.balanceOf(address(campaign)), s.accountedBalance);
        assertLe(s.claimedCount, s.supporterCount);
        if (s.outcome != I.Outcome.Successful) assertEq(s.totalPaid, 0);
        if (handler.hasSettled()) {
            assertEq(s.refundPool, handler.frozenPool()); assertEq(s.refundPool, s.totalContributed - s.totalPaid);
            assertTrue(s.phase == I.Phase.Refunding || s.phase == I.Phase.Closed);
        }
        if (s.phase == I.Phase.Closed && s.refundPool > 0) {
            assertEq(s.claimedCount, s.supporterCount); assertLt(s.refundPool - s.totalRefunded, s.supporterCount);
        }
    }
}
