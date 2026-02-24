/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sol_maker.json`.
 */
export type SolMaker = {
  address: "A7xg3N2S6hkFcaFS9pkurxLT8gLeHxtkSwhda4MhRBqb";
  metadata: {
    name: "solMaker";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "initializeFeeConfig";
      discriminator: [62, 162, 20, 133, 121, 65, 145, 27];
      accounts: [
        {
          name: "feeConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101, 95, 99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "fees";
          type: {
            defined: {
              name: "feeConfigInput";
            };
          };
        },
        {
          name: "owner";
          type: "pubkey";
        },
      ];
    },
    {
      name: "updateFeeConfig";
      discriminator: [104, 184, 103, 242, 88, 151, 107, 20];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "feeConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101, 95, 99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: "fees";
          type: {
            defined: {
              name: "feeConfigInput";
            };
          };
        },
      ];
    },
    {
      name: "withdrawFees";
      discriminator: [198, 212, 171, 109, 144, 215, 174, 89];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "feeConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101, 95, 99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "receiver";
          writable: true;
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "feeConfig";
      discriminator: [143, 52, 146, 187, 219, 123, 76, 155];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "unauthorized";
      msg: "Unauthorized: only owner can perform this action";
    },
    {
      code: 6001;
      name: "insufficientFunds";
      msg: "Insufficient lamports in fee config";
    },
  ];
  types: [
    {
      name: "feeConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "createTokenFee";
            type: "u64";
          },
          {
            name: "modifyCreatorInfoFee";
            type: "u64";
          },
          {
            name: "customTokenAddressFee";
            type: "u64";
          },
          {
            name: "accountDeleteRefundFee";
            type: "u64";
          },
          {
            name: "revokeMintAuthorityFee";
            type: "u64";
          },
          {
            name: "revokeFreezeAuthorityFee";
            type: "u64";
          },
          {
            name: "revokeMetadataAuthorityFee";
            type: "u64";
          },
          {
            name: "updateMintAuthorityFee";
            type: "u64";
          },
          {
            name: "updateFreezeAuthorityFee";
            type: "u64";
          },
          {
            name: "updateMetadataAuthorityFee";
            type: "u64";
          },
          {
            name: "mintTokensFee";
            type: "u64";
          },
          {
            name: "burnTokensFee";
            type: "u64";
          },
          {
            name: "freezeUserFee";
            type: "u64";
          },
          {
            name: "unfreezeUserFee";
            type: "u64";
          },
          {
            name: "updateMetadataFee";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "feeConfigInput";
      type: {
        kind: "struct";
        fields: [
          {
            name: "createTokenFee";
            type: "u64";
          },
          {
            name: "modifyCreatorInfoFee";
            type: "u64";
          },
          {
            name: "customTokenAddressFee";
            type: "u64";
          },
          {
            name: "accountDeleteRefundFee";
            type: "u64";
          },
          {
            name: "revokeMintAuthorityFee";
            type: "u64";
          },
          {
            name: "revokeFreezeAuthorityFee";
            type: "u64";
          },
          {
            name: "revokeMetadataAuthorityFee";
            type: "u64";
          },
          {
            name: "updateMintAuthorityFee";
            type: "u64";
          },
          {
            name: "updateFreezeAuthorityFee";
            type: "u64";
          },
          {
            name: "updateMetadataAuthorityFee";
            type: "u64";
          },
          {
            name: "mintTokensFee";
            type: "u64";
          },
          {
            name: "burnTokensFee";
            type: "u64";
          },
          {
            name: "freezeUserFee";
            type: "u64";
          },
          {
            name: "unfreezeUserFee";
            type: "u64";
          },
          {
            name: "updateMetadataFee";
            type: "u64";
          },
        ];
      };
    },
  ];
};
