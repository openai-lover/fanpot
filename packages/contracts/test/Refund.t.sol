// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BaseTest, I, MockUSDC} from "./Base.t.sol";
contract RefundTest is BaseTest {
    function testGoalMissedFullRefundOnlyOriginalAddress() public {
        activate(); fund(alice, 3e6); fund(bob, 1e6); vm.warp(campaign.deadline()); campaign.finalize();
        assertEq(campaign.claimable(alice), 3e6);
        vm.prank(vendor); campaign.claimRefundFor(alice);
        assertEq(token.balanceOf(alice), 3e6); assertEq(token.balanceOf(vendor), 0);
        vm.expectRevert(I.AlreadyClaimed.selector); campaign.claimRefundFor(alice);
        vm.expectRevert(I.NoContribution.selector); campaign.claimRefundFor(vendor);
        vm.prank(bob); campaign.claimRefund();
        assertEq(campaign.totalRefunded(), 4e6); assertEq(uint256(campaign.phase()), uint256(I.Phase.Closed));
    }
    function testCancelledFundingAndReady() public {
        vm.prank(organizer); campaign.stop(); assertEq(uint256(campaign.phase()), uint256(I.Phase.Closed));
        campaign = create(10e6, 9e6); activate(); fund(alice, 1e6);
        vm.prank(reviewer); campaign.stop(); assertEq(uint256(campaign.outcome()), uint256(I.Outcome.Cancelled));
        campaign.claimRefundFor(alice); assertEq(token.balanceOf(alice), 1e6);
    }
    function testRevertingTransferDoesNotConsumeClaimEvenForLastSupporter() public {
        activate(); fund(alice, 1e6); vm.prank(organizer); campaign.stop();
        token.setMode(MockUSDC.Mode.RevertTransfer);
        vm.expectRevert(); campaign.claimRefundFor(alice);
        assertFalse(campaign.claimed(alice)); assertEq(campaign.claimedCount(), 0); assertEq(campaign.totalRefunded(), 0);
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Refunding));
        token.setMode(MockUSDC.Mode.Normal); campaign.claimRefundFor(alice);
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Closed));
    }
    function testClaimReentrancyBlocked() public {
        activate(); fund(alice, 1e6); fund(bob, 1e6); vm.prank(organizer); campaign.stop();
        token.setMode(MockUSDC.Mode.Reenter);
        token.setCallback(address(campaign), abi.encodeCall(campaign.claimRefundFor, (bob)));
        campaign.claimRefundFor(alice); assertFalse(token.callbackSucceeded()); assertFalse(campaign.claimed(bob));
        assertEq(campaign.totalRefunded(), 1e6);
    }
    function testZeroRoundedClaimAndDust() public {
        campaign = create(1e6, 999_999); activate(); fund(alice, 900_000); fund(bob, 100_000); pay(999_999); campaign.settle();
        assertEq(campaign.claimable(alice), 0); assertEq(campaign.claimable(bob), 0);
        token.setMode(MockUSDC.Mode.RevertTransfer); // zero claims must not call the token
        campaign.claimRefundFor(alice); campaign.claimRefundFor(bob);
        assertEq(campaign.claimedCount(), 2); assertEq(token.balanceOf(address(campaign)), 1);
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Closed));
    }
    function testUnclaimedFundsNeverExpireAndDonationDoesNotChangePool() public {
        successful(); pay(9e6); campaign.settle(); token.mint(address(campaign), 5e6);
        vm.warp(block.timestamp + 3650 days); campaign.claimRefundFor(alice);
        assertEq(campaign.refundPool(), 1e6); assertEq(campaign.claimable(bob), 700_000);
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Refunding));
    }
    function testFuzzRefundOrderAndRounding(uint256 a, uint256 paid, bool reverse) public {
        a = bound(a, 100_000, 9_900_000); paid = bound(paid, 1, 9_000_000);
        activate(); fund(alice, a); fund(bob, 10e6 - a); pay(paid); campaign.settle();
        uint256 expectedA = a * (10e6 - paid) / 10e6;
        uint256 expectedB = (10e6 - a) * (10e6 - paid) / 10e6;
        campaign.claimRefundFor(reverse ? bob : alice); campaign.claimRefundFor(reverse ? alice : bob);
        assertEq(token.balanceOf(alice), expectedA); assertEq(token.balanceOf(bob), expectedB);
        assertLe(campaign.totalRefunded(), campaign.refundPool());
        assertLt(campaign.refundPool() - campaign.totalRefunded(), 2);
    }
}
