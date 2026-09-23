// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BaseTest, I, FanPotCampaign, MockUSDC} from "./Base.t.sol";

contract CampaignTest is BaseTest {
    function testInvalidConfigs() public {
        I.Config memory c = config(10e6);
        c.organizer = address(0); expectBadConfig(c, inputs(9e6));
        c = config(10e6); c.reviewer = organizer; expectBadConfig(c, inputs(9e6));
        c = config(10e6); c.reviewer = address(0); expectBadConfig(c, inputs(9e6));
        c = config(10e6); c.usdc = address(0); expectBadConfig(c, inputs(9e6));
        c = config(100e6 + 1); expectBadConfig(c, inputs(9e6));
        c = config(1e6 - 1); expectBadConfig(c, inputs(1));
        c = config(10e6); c.rulesHash = 0; expectBadConfig(c, inputs(9e6));
        c = config(10e6); c.deadline = uint64(block.timestamp); expectBadConfig(c, inputs(9e6));
        c = config(10e6); c.deadline = uint64(block.timestamp + 30 days + 1); expectBadConfig(c, inputs(9e6));
        c = config(10e6); c.settleBy++; expectBadConfig(c, inputs(9e6));
        c = config(10e6); expectBadConfig(c, inputs(10e6 + 1));
        expectBadConfig(c, inputs(0));
        expectBadConfig(c, new I.AllocationInput[](0)); expectBadConfig(c, new I.AllocationInput[](4));
        I.AllocationInput[] memory a = inputs(9e6);
        a[0].recipient = organizer; expectBadConfig(c, a);
        a[0].recipient = reviewer; expectBadConfig(c, a);
        a[0].recipient = address(0); expectBadConfig(c, a);
        a[0].recipient = vendor; a[0].purposeHash = 0; expectBadConfig(c, a);
        token.setDecimals(18); expectBadConfig(c, inputs(9e6));
    }
    function expectBadConfig(I.Config memory c, I.AllocationInput[] memory a) internal {
        vm.expectRevert(I.InvalidConfig.selector); new FanPotCampaign(c, a);
    }
    function testCapSumAcrossThreeItems() public {
        I.AllocationInput[] memory a = new I.AllocationInput[](3);
        for (uint256 i; i < 3; ++i) a[i] = I.AllocationInput(vendor, 4e6, evidence);
        expectBadConfig(config(10e6), a);
    }
    function testRecipientCannotBeCampaignItself() public {
        address predicted = vm.computeCreateAddress(address(this), vm.getNonce(address(this)));
        I.AllocationInput[] memory a = inputs(9e6); a[0].recipient = predicted;
        expectBadConfig(config(10e6), a);
    }
    function testActivationRoleAndTiming() public {
        vm.expectRevert(I.Unauthorized.selector); campaign.activate();
        vm.warp(campaign.deadline() - 1 days + 1);
        vm.prank(reviewer); vm.expectRevert(I.NotReady.selector); campaign.activate();
        vm.warp(campaign.deadline() - 1 days); activate();
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Funding));
        vm.prank(reviewer); vm.expectRevert(I.InvalidState.selector); campaign.activate();
    }
    function testCannotContributeReadyAndCannotFinalizeEarly() public {
        vm.expectRevert(I.InvalidState.selector); campaign.contribute(1e6, evidence);
        vm.expectRevert(I.NotReady.selector); campaign.finalize();
        activate(); vm.expectRevert(I.NotReady.selector); campaign.finalize();
    }
    function testReadyExpiresClosedAndNoDuplicateEvents() public {
        vm.warp(campaign.deadline()); campaign.finalize();
        assertEq(uint256(campaign.outcome()), uint256(I.Outcome.Cancelled));
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Closed));
        vm.recordLogs(); campaign.finalize(); campaign.settle();
        assertEq(vm.getRecordedLogs().length, 0);
    }
    function testExactGoalSuccessAndNoMoreContributions() public {
        successful();
        assertEq(campaign.totalContributed(), 10e6);
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Successful));
        vm.expectRevert(I.InvalidState.selector); campaign.contribute(1e6, evidence);
        vm.recordLogs(); campaign.finalize(); assertEq(vm.getRecordedLogs().length, 0);
    }
    function testGoalCapDoesNotPartiallyAccept() public {
        activate(); fund(alice, 9e6);
        vm.prank(bob); vm.expectRevert(I.GoalCapacityExceeded.selector); campaign.contribute(2e6, evidence);
        assertEq(campaign.totalContributed(), 9e6); assertEq(campaign.contributions(bob), 0);
    }
    function testSmallFinalRemainderAndMinimum() public {
        activate();
        vm.expectRevert(I.InvalidAmount.selector); campaign.contribute(99_999, evidence);
        vm.expectRevert(I.InvalidAmount.selector); campaign.contribute(0, evidence);
        fund(alice, 9_950_000); fund(bob, 50_000);
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Successful));
    }
    function testWalletCapRepeatedContributionOrdinalAndReplay() public {
        campaign = create(100e6, 90e6); activate(); fund(alice, 10e6); fund(alice, 10e6);
        assertEq(campaign.supporterCount(), 1); assertEq(campaign.supporterOrdinal(alice), 1);
        vm.prank(alice); vm.expectRevert(I.WalletCapExceeded.selector); campaign.contribute(1e6, evidence);
        fund(bob, 1e6);
        vm.prank(bob); vm.expectRevert(I.DuplicateClientRef.selector); campaign.contribute(1e6, bytes32(refCounter));
        vm.prank(bob); vm.expectRevert(I.InvalidConfig.selector); campaign.contribute(1e6, 0);
    }
    function testDeadlineBoundary() public {
        activate(); vm.warp(campaign.deadline() - 1); fund(alice, 1e6);
        vm.warp(campaign.deadline()); vm.expectRevert(I.DeadlinePassed.selector); campaign.contribute(1e6, evidence);
        campaign.finalize(); assertEq(uint256(campaign.outcome()), uint256(I.Outcome.Failed));
        vm.warp(campaign.deadline() + 1); campaign.finalize(); assertEq(campaign.refundPool(), 1e6);
    }
    function testBadDeltaRollsBackAllState() public {
        activate(); token.mint(alice, 10e6); vm.prank(alice); token.approve(address(campaign), 10e6);
        token.setMode(MockUSDC.Mode.BadDelta);
        vm.prank(alice); vm.expectRevert(I.UnexpectedTokenDelta.selector); campaign.contribute(10e6, evidence);
        assertEq(campaign.totalContributed(), 0); assertEq(campaign.supporterCount(), 0);
        assertEq(campaign.contributions(alice), 0); assertFalse(campaign.usedClientRefs(alice, evidence));
        assertEq(token.balanceOf(alice), 10e6); assertEq(uint256(campaign.phase()), uint256(I.Phase.Funding));
    }
    function testTransferFromFailuresRollback() public {
        activate(); token.mint(alice, 1e6); vm.prank(alice); token.approve(address(campaign), 1e6);
        token.setMode(MockUSDC.Mode.FalseReturn);
        vm.prank(alice); vm.expectRevert(); campaign.contribute(1e6, evidence);
        token.setMode(MockUSDC.Mode.RevertTransfer);
        vm.prank(alice); vm.expectRevert(); campaign.contribute(1e6, evidence);
        assertFalse(campaign.usedClientRefs(alice, evidence)); assertEq(campaign.totalContributed(), 0);
    }
    function testNoReturnTokenAccepted() public { activate(); token.setMode(MockUSDC.Mode.NoReturn); fund(alice, 1e6); assertEq(campaign.totalContributed(), 1e6); }
    function testReentrantContributionBlocked() public {
        activate(); token.setMode(MockUSDC.Mode.Reenter);
        token.setCallback(address(campaign), abi.encodeCall(campaign.contribute, (1e6, evidence)));
        fund(alice, 1e6); assertFalse(token.callbackSucceeded()); assertEq(campaign.totalContributed(), 1e6);
    }
    function testDirectTokenAndNativeTransfers() public {
        token.mint(address(campaign), 99e6); activate(); fund(alice, 1e6);
        assertEq(campaign.totalContributed(), 1e6);
        vm.warp(campaign.deadline()); campaign.finalize(); assertEq(campaign.refundPool(), 1e6);
        campaign.claimRefundFor(alice); assertEq(token.balanceOf(address(campaign)), 99e6);
        vm.deal(address(this), 1 ether);
        (bool ok,) = address(campaign).call{value: 1}(""); assertFalse(ok);
        (ok,) = address(campaign).call(hex"12345678"); assertFalse(ok);
    }
    function testEmptyFundingClosesWithoutDivision() public {
        activate(); vm.warp(campaign.deadline()); campaign.finalize();
        assertEq(uint256(campaign.phase()), uint256(I.Phase.Closed)); assertEq(campaign.claimable(alice), 0);
    }
}
