import { useEffect } from "react";
import "./App.css";
import { ethers } from "ethers";
import { FACTORY_ABI } from "./abi/factory";
import { v4 as uuid } from "uuid";

function App() {
    useEffect(() => {
        runEthers();
    }, []);

    const runEthers = async () => {
        // Common frontend

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log("provider: ", provider);
        const wallets = await window.ethereum.request({
            method: "eth_requestAccounts",
        });
        const address = wallets[0];
        console.log("address: ", address);
        const signer = provider.getSigner(address);

        // Message sign frontend

        const message = {
            title: "title",
            content: "content",
            image: "http://example.com",
            price: ethers.utils.parseUnits("0.001", "ether"),
        };

        const signature = await signer.signMessage(JSON.stringify(message));

        console.log("Message sign post body: ", { ...message, signature });

        // Message sign backend

        const messageSeller = ethers.utils.verifyMessage(
            JSON.stringify(message),
            signature
        );
        console.log("messageSeller: ", messageSeller);

        // Transaction sign frontend
        const FACTORY_CONTRACT = "0x568996c47EdF580D0734c7728004d7d51A7df260";
        const UUID = uuid();
        console.log(UUID);

        const contract = new ethers.Contract(
            FACTORY_CONTRACT,
            FACTORY_ABI,
            provider
        );
        const buyer = "0x0b6411C390c28D7e7c9D5147d6c7c52f6B89cD8E";
        const seller = "0xeF537D52B63D33a713670B540dFc7D11081fa761";
        const receiver = "0x4c2d2742A153503AF6210c1D9455E9Ff64FFb89d";
        const market = "0xeF3010D076f62A91A774016E5eBAf58A1BFe1bD6";

        const transaction = {
            to: FACTORY_CONTRACT, // contract
            data: contract.interface.encodeFunctionData("createEscrow", [
                buyer,
                seller,
                receiver,
                market,
                ethers.utils.parseUnits("0.001", "ether"),
                UUID,
            ]),
            value: ethers.utils.parseUnits("0.001", "ether"),
            gasLimit: 3000000,
        };
        await signer.sendTransaction(transaction);
        console.log("Transaction sign post body: ", {
            buyer,
            receiver,
            uuid: UUID,
        });

        // Transaction sign backend

        const backProvider = new ethers.providers.JsonRpcProvider(
            "https://rpc.sepolia.org"
        );
        const backContract = new ethers.Contract(
            FACTORY_CONTRACT,
            FACTORY_ABI,
            backProvider
        );

        backContract.on("EscrowCreated", async (escrowAddress, escrowUUID) => {
            if (UUID === escrowUUID) {
                console.log("escrowAddress: ", escrowAddress);
                console.log("escrowUUID: ", escrowUUID);
            }
        });
    };

    return <div className="App"></div>;
}

export default App;
