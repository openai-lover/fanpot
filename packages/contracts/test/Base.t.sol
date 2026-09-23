// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Test} from "forge-std/Test.sol";
import {FanPotCampaign} from "../src/FanPotCampaign.sol";
import {FanPotFactory} from "../src/FanPotFactory.sol";
import {IFanPotCampaign as I} from "../src/IFanPotCampaign.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

abstract contract BaseTest is Test {
    MockUSDC internal token;
    FanPotFactory internal factory;
    FanPotCampaign internal campaign;
    address internal organizer = address(0x101);
    address internal reviewer = address(0x102);
    address internal vendor = address(0x103);
    address internal alice = address(0x104);
    address internal bob = address(0x105);
    bytes32 internal evidence = keccak256("redacted test evidence");
    uint256 internal refCounter;
    function setUp() public virtual {
        vm.warp(1_800_000_000);
        token = new MockUSDC();
        factory = new FanPotFactory(address(this), reviewer, address(token));
        factory.setOrganizerAllowed(organizer, true);
        campaign = create(10e6, 9e6);
    }
    function inputs(uint256 cap) internal view returns (I.AllocationInput[] memory a) {
        a = new I.AllocationInput[](1);
        a[0] = I.AllocationInput(vendor, cap, keccak256("birthday ad"));
    }
    function config(uint256 goal) internal view returns (I.Config memory) {
        return I.Config(organizer, reviewer, address(token), goal, uint64(block.timestamp + 7 days),
            uint64(block.timestamp + 21 days), keccak256("canonical rules fixture"));
    }
    function create(uint256 goal, uint256 cap) internal returns (FanPotCampaign) {
        vm.prank(organizer);
        return FanPotCampaign(payable(factory.createCampaign(goal, uint64(block.timestamp + 7 days),
            keccak256("canonical rules fixture"), inputs(cap), bytes32(++refCounter))));
    }
    function activate() internal { vm.prank(reviewer); campaign.activate(); }
    function fund(address supporter, uint256 amount) internal {
        token.mint(supporter, amount);
        vm.startPrank(supporter);
        token.approve(address(campaign), amount);
        campaign.contribute(amount, bytes32(++refCounter));
        vm.stopPrank();
    }
    function successful() internal { activate(); fund(alice, 3e6); fund(bob, 7e6); }
    function pay(uint256 amount) internal {
        vm.prank(organizer); campaign.requestPayout(0, amount, evidence);
        vm.prank(reviewer); campaign.approveAndPay(0, amount, evidence);
    }
}
