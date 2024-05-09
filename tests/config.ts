import { PrivateKey } from "o1js";

interface ContractConfig {
  contractPrivateKey: PrivateKey;
  contractAddress: string;
}

export const contract: ContractConfig = {
  contractPrivateKey: PrivateKey.fromBase58(
    "EKEhZwSy9be82EqLT3s8Fa4QPxE8fTGiGW1w3XC4ho3RmWqBmQh2"
  ),
  contractAddress: "B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD",
};

export const DEPLOYER = "EKFDvpBMGGa1bGrE9BhNLzr4VEBopt9ANfwTzE5Z3yqSBegiUUhk";
// "B62qrvVL5oJWT8K4ijnq83V3MYHv95jhrJ2T3X56GL7nfowNFvcDFST"

export const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NTkwMzQ5NDYiLCJpYXQiOjE3MDEzNTY5NzEsImV4cCI6MTczMjg5Mjk3MX0.r94tKntDvLpPJT2zzEe7HMUcOAQYQu3zWNuyFFiChD0";
