class Client {
  get(ipfsHash) {
    console.log("----")
    console.log(ipfsHash)
    if (!ipfsHash) {
      throw Error("ERR")
    }
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    return fetch(url).then(res => res.json());
  }
}

const client = new Client();

export default client;
