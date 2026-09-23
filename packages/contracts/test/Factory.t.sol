// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BaseTest, I, FanPotFactory, FanPotCampaign} from "./Base.t.sol";
contract FactoryTest is BaseTest {
    function testAllowlistAndDuplicateDraftRef() public {
        vm.expectRevert(FanPotFactory.Unauthorized.selector);
        factory.createCampaign(10e6, uint64(block.timestamp + 7 days), evidence, inputs(9e6), evidence);
        vm.startPrank(organizer);
        vm.expectRevert(FanPotFactory.InvalidConfig.selector);
        factory.createCampaign(10e6, uint64(block.timestamp + 7 days), evidence, inputs(9e6), 0);
        address deployed = factory.createCampaign(10e6, uint64(block.timestamp + 7 days), evidence, inputs(9e6), evidence);
        vm.expectRevert(FanPotFactory.DuplicateDraftRef.selector);
        factory.createCampaign(10e6, uint64(block.timestamp + 7 days), evidence, inputs(9e6), evidence);
        vm.stopPrank(); assertTrue(factory.isCampaign(deployed)); assertGt(deployed.code.length, 0);
    }
    function testOwnerTransferIsTwoSteps() public {
        factory.transferOwnership(alice); assertEq(factory.owner(), address(this)); assertEq(factory.pendingOwner(), alice);
        vm.prank(bob); vm.expectRevert(); factory.acceptOwnership();
        vm.prank(alice); factory.acceptOwnership(); assertEq(factory.owner(), alice);
        vm.expectRevert(); factory.setOrganizerAllowed(organizer, false);
    }
    function testAllowlistRevocationCannotBlockRefunds() public {
        activate(); fund(alice, 1e6); factory.setOrganizerAllowed(organizer, false);
        vm.prank(organizer); vm.expectRevert(FanPotFactory.Unauthorized.selector);
        factory.createCampaign(10e6, uint64(block.timestamp + 7 days), evidence, inputs(9e6), evidence);
        vm.warp(campaign.deadline()); campaign.finalize(); campaign.claimRefundFor(alice);
        assertEq(token.balanceOf(alice), 1e6);
    }
    function testCampaignsAreIsolated() public {
        FanPotCampaign other = create(10e6, 9e6); successful(); pay(9e6); campaign.settle(); campaign.claimRefundFor(alice);
        assertEq(other.totalContributed(), 0); assertEq(other.totalPaid(), 0); assertEq(token.balanceOf(address(other)), 0);
        assertEq(uint256(other.phase()), uint256(I.Phase.Ready));
    }
    function testInvalidFactoryAndUnauthorizedAllowlist() public {
        vm.expectRevert(); new FanPotFactory(address(0), reviewer, address(token));
        vm.expectRevert(FanPotFactory.InvalidConfig.selector); new FanPotFactory(address(this), address(0), address(token));
        vm.expectRevert(FanPotFactory.InvalidConfig.selector); factory.setOrganizerAllowed(reviewer, true);
        vm.expectRevert(FanPotFactory.InvalidConfig.selector); factory.setOrganizerAllowed(address(0), true);
        vm.prank(alice); vm.expectRevert(); factory.setOrganizerAllowed(alice, true);
    }
}
