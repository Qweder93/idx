import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-watcher';
import '@nomicfoundation/hardhat-verify';

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: '0.8.20',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        hardhat: {
            gasPrice: 20000000000, // 20 Gwei
            allowUnlimitedContractSize: !true,
            // loggingEnabled: true,
            // blockGasLimit: 8000000,
        },
        localnet: {
            chainId: 31415926,
            url: 'http://127.0.0.1:1234/rpc/v1',
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        calibrationnet: {
            chainId: 314159,
            url: process.env.PROVIDER_URI || '',
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        filecoinmainnet: {
            chainId: 314,
            url: process.env.PROVIDER_URI || '',
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        subnet: {
            chainId: Number(process.env.CHAIN_ID) || undefined,
            url: process.env.PROVIDER_URI || '',
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        avalanche: {
            chainId: 43113,
            url: process.env.PROVIDER_URI || '',
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        akavelocal: {
            chainId: 43112,
            url: process.env.PROVIDER_URI || '',
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        akavefuji: {
            chainId: 31337,
            url: process.env.PROVIDER_URI || '',
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        sepolia: {
            url: process.env.PROVIDER_URI || 'https://ethereum-sepolia-rpc.publicnode.com',
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: 11155111,
        },
    },
    watcher: {
        test: {
            tasks: [{ command: 'test', params: { testFiles: ['{path}'] } }],
            files: ['./test/**/*'],
            verbose: true,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === 'true',
        // coinmarketcap: process.env.REPORT_COINMARKETCAP,
        // currency: process.env.REPORT_CURRENCY,
        // token: process.env.REPORT_TOKEN,
        // gasPriceApi: process.env.REPORT_GAS_PRICE_API,
        // gasPrice: 25,
    },
    etherscan: {
        apiKey: {
            mainnet: <string>process.env.ETHERSCAN_API_KEY,
            sepolia: <string>process.env.ETHERSCAN_API_KEY,
        },
    },
};

export default config;
