// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8.4;

import { ISuperAgreement } from "../superfluid/ISuperAgreement.sol";
import { ISuperfluidToken } from "../superfluid/ISuperfluidToken.sol";
import { ISuperTokenPool } from "../../superfluid/SuperTokenPool.sol";

/**
 * @title General Distribution Agreement interface
 * @author Superfluid
 */
abstract contract IGeneralDistributionAgreementV1 is ISuperAgreement {
    // Custom Errors
    error NO_NEGATIVE_UNITS();
    error NOT_POOL_ADMIN();
    error ONLY_SUPER_TOKEN_POOL();

    // Events
    event DistributionFlowUpdated(
        ISuperfluidToken indexed token,
        ISuperTokenPool indexed pool,
        address indexed distributor,
        uint32 distributedAt,
        int96 oldFlowRate,
        int96 newFlowRate
    );

    event PoolCreated(
        ISuperfluidToken indexed token,
        address indexed admin,
        ISuperTokenPool pool
    );

    event PoolConnectionUpdated(
        ISuperfluidToken indexed token,
        address indexed account,
        ISuperTokenPool indexed pool,
        bool connected
    );

    event UniversalIndexUpdated(
        ISuperfluidToken indexed token,
        address indexed account,
        uint32 settledAt,
        int256 settledValue,
        int96 flowRate
    );

    /// @dev ISuperAgreement.agreementType implementation
    function agreementType() external pure override returns (bytes32) {
        return
            keccak256(
                "org.superfluid-finance.agreements.GeneralDistributionAgreement.v1"
            );
    }

    function getNetFlowRate(
        ISuperfluidToken token,
        address account
    ) external view virtual returns (int96);

    function getFlowRate(
        address from,
        address to
    ) external view virtual returns (int96);

    function getFlowDistributionActualFlowRate(
        ISuperfluidToken token,
        address from,
        ISuperTokenPool to,
        int96 requestedFlowRate
    ) external view virtual returns (int96 finalFlowRate);

    function realtimeBalanceVectorAt(
        ISuperfluidToken token,
        address account,
        uint256 time
    ) public view virtual returns (int256 available, int256 deposit);

    function realtimeBalanceOfNow(
        ISuperfluidToken token,
        address account
    ) external view virtual returns (int256 rtb);

    ////////////////////////////////////////////////////////////////////////////////
    // Pool Operations
    ////////////////////////////////////////////////////////////////////////////////
    function createPool(
        address admin,
        ISuperfluidToken token
    ) external virtual returns (ISuperTokenPool pool);

    function connectPool(
        ISuperTokenPool pool,
        bytes calldata ctx
    ) external virtual returns (bytes memory newCtx);

    function disconnectPool(
        ISuperTokenPool pool,
        bytes calldata ctx
    ) external virtual returns (bytes memory newCtx);

    // function connectPool(
    //     ISuperTokenPool pool,
    //     bool doConnect,
    //     bytes calldata ctx
    // ) public virtual returns (bytes memory newCtx);

    function isMemberConnected(
        address pool,
        address member
    ) external view virtual returns (bool);

    ////////////////////////////////////////////////////////////////////////////////
    // Agreement Operations
    ////////////////////////////////////////////////////////////////////////////////

    function distribute(
        ISuperfluidToken token,
        ISuperTokenPool pool,
        uint256 requestedAmount,
        bytes calldata ctx
    ) external virtual returns (bytes memory newCtx);

    function distributeFlow(
        ISuperfluidToken token,
        ISuperTokenPool pool,
        int96 requestedFlowRate,
        bytes calldata ctx
    ) external virtual returns (bytes memory newCtx);
}
