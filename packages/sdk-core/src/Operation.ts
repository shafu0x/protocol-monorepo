import { ethers } from "ethers";

export type BatchOperationType =
    | "UNSUPPORTED" // 0
    | "ERC20_APPROVE" // 1
    | "ERC20_TRANSFER_FROM" // 2
    | "ERC777_SEND" // 3
    | "ERC20_INCREASE_ALLOWANCE" // 4
    | "ERC20_DECREASE_ALLOWANCE" // 5
    | "SUPERTOKEN_UPGRADE" // 101
    | "SUPERTOKEN_DOWNGRADE" // 102
    | "SUPERFLUID_CALL_AGREEMENT" // 201
    | "CALL_APP_ACTION"; // 202

/**
 * Operation Helper Class
 * @description A helper class to create `Operation` objects which can be executed or batched.
 */
export default class Operation {
    readonly populateTransactionPromise: Promise<ethers.PopulatedTransaction>;
    readonly type: BatchOperationType;

    // @note This property is used to ensure BatchCall operations still function
    // when using the agreement forwarder
    readonly forwarderPopulatedPromise?: Promise<ethers.PopulatedTransaction>;

    constructor(
        txn: Promise<ethers.PopulatedTransaction>,
        type: BatchOperationType,
        forwarderPopulatedPromise?: Promise<ethers.PopulatedTransaction>
    ) {
        this.populateTransactionPromise = txn;
        this.type = type;
        this.forwarderPopulatedPromise = forwarderPopulatedPromise;
    }

    /**
     * Executes the operation via the provided signer.
     * @description Populates all fields of the transaction, signs it and sends it to the network.
     * @param signer The signer of the transaction
     * @param gasLimitMultiplier A multiplier to provide gasLimit buffer on top of the estimated gas limit (1.2x is the default)
     * @returns {ethers.providers.TransactionResponse} A TransactionResponse object which can be awaited
     */
    exec = async (
        signer: ethers.Signer,
        gasLimitMultiplier = 1.2
    ): Promise<ethers.providers.TransactionResponse> => {
        const populatedTransaction = await this.getPopulatedTransactionRequest(
            signer,
            gasLimitMultiplier
        );
        return await signer.sendTransaction(populatedTransaction);
    };

    /**
     * Get the populated transaction by awaiting `populateTransactionPromise`.
     * `providerOrSigner` is used for gas estimation if necessary.
     * NOTE: we use the forwarder populated promise if this exists
     */
    getPopulatedTransactionRequest = async (
        providerOrSigner: ethers.providers.Provider | ethers.Signer,
        gasLimitMultiplier = 1.2
    ): Promise<ethers.PopulatedTransaction> => {
        const populatedTransaction = this.forwarderPopulatedPromise
            ? await this.forwarderPopulatedPromise
            : await this.populateTransactionPromise;

        // if gasLimit exists, an Overrides object has been passed or the user has explicitly set
        // a gasLimit for their transaction prior to execution and so we keep it as is else we apply
        // a specified or the default (1.2) multiplier on the gas limit.
        if (!populatedTransaction.gasLimit) {
            const estimatedGasLimit = await providerOrSigner.estimateGas(
                populatedTransaction
            );

            // NOTE: BigNumber doesn't support multiplication with decimals.
            const commonDenominator = 100;
            const multipliedGasLimit =
                gasLimitMultiplier === 1 // No need to modify estimated gas limit when multiplier is 1.
                    ? estimatedGasLimit
                    : estimatedGasLimit
                          .div(commonDenominator)
                          .mul(
                              Math.round(gasLimitMultiplier * commonDenominator)
                          );

            populatedTransaction.gasLimit = multipliedGasLimit;
        }

        return populatedTransaction;
    };
    /**
     * Signs the populated transaction via the provided signer (what you intend on sending to the network).
     * @param signer The signer of the transaction
     * @returns {Promise<string>} Fully serialized, signed transaction
     */
    getSignedTransaction = async (
        signer: ethers.Signer,
        gasLimitMultiplier = 1.2
    ): Promise<string> => {
        const populatedTransaction = await this.getPopulatedTransactionRequest(
            signer,
            gasLimitMultiplier
        );
        const signerPopulatedTransaction = await signer.populateTransaction(
            populatedTransaction
        );
        const signedTransaction = await signer.signTransaction(
            signerPopulatedTransaction
        );
        return signedTransaction;
    };

    /**
     * Gets the transaction hash of the transaction.
     * @description Calculates this by getting the keccak256 hash of the signedTxn.
     * @param signer The signer of the transaction
     * @returns {Promise<string>} The transaction hash of the transaction
     */
    getTransactionHash = async (signer: ethers.Signer): Promise<string> => {
        const signedTxn = await this.getSignedTransaction(signer);
        return ethers.utils.keccak256(signedTxn);
    };
}
