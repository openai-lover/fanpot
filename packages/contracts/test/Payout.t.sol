// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BaseTest, I, MockUSDC} from "./Base.t.sol";
contract PayoutTest is BaseTest {
    function testPayoutBeforeSuccessAndUnauthorized() public {
        activate(); fund(alice, 1e6);
        vm.prank(organizer); vm.expectRevert(I.InvalidState.selector); campaign.requestPayout(0, 1e6, evidence);
        vm.prank(reviewer); vm.expectRevert(I.InvalidState.selector); campaign.approveAndPay(0, 1e6, evidence);
        fund(bob, 9e6);
        vm.expectRevert(I.Unauthorized.selector); campaign.requestPayout(0, 1e6, evidence);
        vm.expectRevert(I.Unauthorized.selector); campaign.approveAndPay(0, 1e6, evidence);
        vm.expectRevert(I.Unauthorized.selector); campaign.skipAllocation(0);
        vm.expectRevert(I.Unauthorized.selector); campaign.stop();
    }
    function testInvalidRequestsAndFrozenRequest() public {
        successful();
        vm.startPrank(organizer);
        vm.expectRevert(I.InvalidAllocation.selector); campaign.requestPayout(1, 1e6, evidence);
        vm.expectRevert(I.InvalidAmount.selector); campaign.requestPayout(0, 10e6, evidence);
        vm.expectRevert(I.InvalidAmount.selector); campaign.requestPayout(0, 0, evidence);
        vm.expectRevert(I.InvalidAmount.selector); campaign.requestPayout(0, 1e6, 0);
        campaign.requestPayout(0, 8e6, evidence);
        vm.expectRevert(I.AlreadyResolved.selector); campaign.requestPayout(0, 9e6, evidence);
        vm.stopPrank();
        vm.startPrank(reviewer);
        vm.expectRevert(I.RequestMismatch.selector); campaign.approveAndPay(0, 9e6, evidence);
        vm.expectRevert(I.RequestMismatch.selector); campaign.approveAndPay(0, 8e6, bytes32(uint256(123)));
        campaign.approveAndPay(0, 8e6, evidence);
        vm.expectRevert(I.InvalidState.selector); campaign.approveAndPay(0, 8e6, evidence);
        vm.expectRevert(I.AlreadyResolved.selector); campaign.skipAllocation(0);
        vm.stopPrank();
        assertEq(token.balanceOf(vendor), 8e6); assertEq(token.balanceOf(organizer), 0);
        assertEq(campaign.totalPaid(), 8e6); assertEq(campaign.totalContributed(), 10e6);
    }
    function testTransferFailureKeepsRequestAndAccounting() public {
        successful(); vm.prank(organizer); campaign.requestPayout(0, 8e6, evidence);
        token.setMode(MockUSDC.Mode.FalseReturn);
        vm.prank(reviewer); vm.expectRevert(); campaign.approveAndPay(0, 8e6, evidence);
        assertEq(campaign.totalPaid(), 0); assertEq(uint256(campaign.getAllocation(0).status), uint256(I.AllocationStatus.Requested));
        token.setMode(MockUSDC.Mode.Normal); vm.prank(reviewer); campaign.approveAndPay(0, 8e6, evidence);
        assertEq(token.balanceOf(vendor), 8e6);
    }
    function testNoReturnPayoutAndReentrancy() public {
        successful(); token.setMode(MockUSDC.Mode.Reenter);
        token.setCallback(address(campaign), abi.encodeCall(campaign.settle, ()));
        pay(9e6); assertFalse(token.callbackSucceeded());
        token.setMode(MockUSDC.Mode.NoReturn); campaign.settle(); campaign.claimRefundFor(alice);
        assertEq(token.balanceOf(alice), 300_000);
    }
    function testSettleByExactBoundary() public {
        successful(); vm.warp(campaign.settleBy() - 1);
        vm.expectRevert(I.NotReady.selector); campaign.settle();
        vm.prank(organizer); campaign.requestPayout(0, 8e6, evidence);
        vm.warp(campaign.settleBy());
        vm.prank(reviewer); vm.expectRevert(I.SettlementExpired.selector); campaign.approveAndPay(0, 8e6, evidence);
        vm.prank(organizer); vm.expectRevert(I.SettlementExpired.selector); campaign.requestPayout(0, 8e6, evidence);
        vm.prank(reviewer); vm.expectRevert(I.SettlementExpired.selector); campaign.skipAllocation(0);
        campaign.settle(); assertEq(campaign.refundPool(), 10e6);
        assertEq(uint256(campaign.settlementReason()), uint256(I.SettlementReason.TimedOut));
        vm.recordLogs(); campaign.settle(); campaign.finalize(); assertEq(vm.getRecordedLogs().length, 0);
    }
    function testEarlySettleAllSkipped() public {
        successful(); vm.prank(organizer); campaign.skipAllocation(0); campaign.settle();
        assertEq(campaign.refundPool(), 10e6); assertEq(uint256(campaign.outcome()), uint256(I.Outcome.Successful));
        vm.prank(reviewer); vm.expectRevert(I.InvalidState.selector); campaign.approveAndPay(0, 8e6, evidence);
    }
    function testZeroRefundPoolClosesDirectly() public {
        campaign = create(10e6, 10e6); successful(); pay(10e6); campaign.settle();
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Closed)); assertEq(campaign.claimedCount(), 0);
    }
    function testStopAfterPayoutKeepsSuccessfulOutcome() public {
        successful(); pay(8e6); vm.prank(organizer); campaign.stop();
        assertEq(uint256(campaign.outcome()), uint256(I.Outcome.Successful));
        assertEq(uint256(campaign.settlementReason()), uint256(I.SettlementReason.Stopped));
        assertEq(campaign.refundPool(), 2e6); assertEq(campaign.claimable(alice), 600_000);
        vm.prank(organizer); vm.expectRevert(I.InvalidState.selector); campaign.stop();
    }
}
