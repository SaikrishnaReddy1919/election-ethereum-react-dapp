const fs = require("fs-extra");
const { web3, web3Network } = require("./web3");
const compileFactoryContract = require("./build/ElectionFactory.json");
const compileContract = require("./build/Election.json");

// Contract object deployed on network (ganache-cli or testnet or mainnet)
// network can be selected in web3 file
const getFactoryObject = () => {
  try {
    let contractReceipt;
    if (web3Network == "ganache") {
      contractReceipt = require("./receipt-ganache.json");
    } else if (web3Network == "rinkeby") {
      contractReceipt = require("./receipt-rinkeby.json");
    }

    const contractObject = new web3.eth.Contract(
      JSON.parse(compileFactoryContract.interface),
      contractReceipt.address
    );
    return contractObject;
  } catch (error) {
    console.error(error);
    throw error.message;
  }
};

const getAccounts = async () => {
  try {
    return await web3.eth.getAccounts();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const createElection = async (account, durationInMins, electionName) => {
  try {
    const contractObject = getFactoryObject();
    const accounts = await web3.eth.getAccounts();
    const receipt = await contractObject.methods
      .createElection(durationInMins, electionName)
      .send({ from: accounts[account], gas: 4000000 });
    console.info(receipt);
    console.info("New Election successfully created!");
    return receipt;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getConductedElections = async () => {
  try {
    const contractObject = await getFactoryObject();
    const accounts = await web3.eth.getAccounts();
    let result = [];
    const elections = await contractObject.methods
      .getElections()
      .call({ from: accounts[0] });

    for (let i = 0; i < elections.length; i++) {
      const electionObject = await getContractObject(elections[i]);
      const electionName = await electionObject.methods
        .electionName()
        .call({ from: accounts[0] });
      result.push({
        electionAddress: elections[i],
        electionName: electionName
      });
    }

    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getElectionAddress = async index => {
  try {
    const elections = await getConductedElections();

    return elections[index];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getContractObject = address => {
  try {
    const contractObject = new web3.eth.Contract(
      JSON.parse(compileContract.interface),
      address
    );

    return contractObject;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getElectionAdmin = async address => {
  try {
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();
    const result = await contractObject.methods
      .admin()
      .call({ from: accounts[0] });
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getElectionName = async address => {
  try {
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();
    const result = await contractObject.methods
      .electionName()
      .call({ from: accounts[0] });
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const addConsituency = async (account, address, consituencyId, name) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const contractObject = getContractObject(address);
    console.info(`Sending transaction from account ${accounts[account]}`);
    const receipt = await contractObject.methods
      .addConsituency(parseInt(consituencyId), name)
      .send({ from: accounts[account], gas: 1000000 });
    console.info(receipt);
    console.info("Consituency successfully added!");
    //  console.info(web3.utils.fromAscii(consituency));
    return receipt;
  } catch (error) {
    console.error(error);
  }
};

// get all the added consituency
const getConsituencyList = async address => {
  try {
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();
    const consituencyIdList = await contractObject.methods
      .getConsituencyIdList()
      .call({ from: accounts[0] });
    // console.log(consituencyIdList);
    const consituencyList = await consituencyIdList.map(consituencyId =>
      getConsituency(address, consituencyId)
    );
    let result = await Promise.all(consituencyList);
    //   console.log("Inside getCOnsituencyList", result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// get the consituency
const getConsituency = async (address, consituencyId) => {
  try {
    //console.log("logic", consituencyId);
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();
    const result = await contractObject.methods
      .consituencyData(consituencyId)
      .call({ from: accounts[0] });
    //    console.log("inside consituency", result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const addVoter = async (
  address,
  account,
  voterId,
  name,
  email,
  phoneNo,
  consituency,
  age
) => {
  try {
    const contractObject = getContractObject(address);
    const receipt = await contractObject.methods
      .addVoter(voterId, name, email, phoneNo, consituency, age)
      .send({ from: account, gas: 3000000 });
    console.info(receipt);
    console.info("Voter successfully added in the consituency !");
    return receipt;
  } catch (error) {
    console.error("ERROR: ", error);
    console.error("ERROR: ", error.message);
    throw error;
  }
};

const getVoterList = async address => {
  try {
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();
    const votersIdList = await contractObject.methods
      .getVotersIdList()
      .call({ from: accounts[0] });
    console.log("logic: get voter list:", votersIdList);
    const votersList = await votersIdList.map(voter =>
      getVoter(address, voter)
    );

    return await Promise.all(votersList);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getVoter = async (address, voterId) => {
  try {
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();
    const result = await contractObject.methods
      .voterData(voterId)
      .call({ from: accounts[0] });
    // console.log("getVoter", result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const addCandidate = async (
  address,
  account,
  candidateId,
  name,
  email,
  phoneNo,
  consituency,
  party
) => {
  try {
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();
    const receipt = await contractObject.methods
      .addCandidate(candidateId, name, email, phoneNo, consituency, party)
      .send({ from: account, gas: 1000000 });
    console.info(receipt);
    console.info("Candidate successfully added in the consituency!");
    return receipt;
  } catch (error) {
    console.error("logic.js: add candidate", error);
    throw error;
  }
};

const getCandidateList = async address => {
  try {
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();

    const candidateIdList = await contractObject.methods
      .getCandidatesIdList()
      .call({ from: accounts[0] });

    const candidateList = await candidateIdList.map(candidateId =>
      getCandidate(address, candidateId)
    );
    // console.log(candidateList);
    return await Promise.all(candidateList);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getCandidate = async (address, candidateId) => {
  try {
    const contractObject = getContractObject(address);
    const accounts = await web3.eth.getAccounts();
    const result = await contractObject.methods
      .candidateData(candidateId)
      .call({ from: accounts[0] });
    // console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// get the candidateList enrolled in a consituency
const getConsituencyCandidates = async (address, account, consituencyId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const contractObject = getContractObject(address);
      //const accounts = await web3.eth.getAccounts();
      const candidateList = await contractObject.methods
        .getConsituencyCandidates(consituencyId)
        .call({ from: account });
      // console.log(
      //   "inside get consituency candidates: canidateList",
      //   candidateList
      // );

      resolve(candidateList);
    } catch (error) {
      console.error("get consituency candidates: ", error);
      reject(error);
    }
  });
};

// get candidates of voter's consituency
const getVoterConsituencyCandidates = async (
  address,
  voterId,
  consituencyId
) => {
  try {
    const candidateList = await getConsituencyCandidates(
      address,
      voterId,
      consituencyId
    );

    let result = {
      consituencyId: consituencyId,
      candidateList: candidateList
    };
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const castVote = async (address, voterId, consituencyId, candidateId) => {
  try {
    console.log(
      "CAST VOTE",
      address,
      voterId,
      consituencyId,
      candidateId,
      "CAST VOTE"
    );
    const contractObject = getContractObject(address);
    const receipt = await contractObject.methods
      .castVote(consituencyId, candidateId)
      .send({ from: voterId, gas: 1000000 });
    console.log(receipt);
    console.info("Voter's vote casted successfully!");
    return receipt;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getCandidateVotes = async (address, consituencyId, candidateId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const contractObject = getContractObject(address);
      const accounts = await web3.eth.getAccounts();
      const result = await contractObject.methods
        .getVotes(consituencyId, candidateId)
        .call({ from: accounts[0] });
      console.log("inside getCandidateVotes", result);
      resolve(result);
    } catch (error) {
      console.error("get candidate votes: ", error);
      reject(error);
    }
  });
};

const closeElection = async (address, account) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const contractObject = getContractObject(address);
    const receipt = await contractObject.methods
      .closeElection()
      .send({ from: account, gas: 1000000 });
    console.info(receipt);
    console.info("election closed successfully!");
    return receipt;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const electionData = async address => {
  try {
    const accounts = await web3.eth.getAccounts();

    const consituencyList = await getConsituencyList(address);

    const consituencyIdList = consituencyList.map(consituency =>
      parseInt(consituency.consituencyId)
    );

    const consituencyCandidateList = await Promise.all(
      consituencyIdList.map(async consituencyId => ({
        consituencyId: consituencyId,
        candidateList: await getConsituencyCandidates(
          address,
          accounts[0],
          consituencyId
        )
      }))
    );
    // console.log(consituencyCandidateList);
    let electionData = await Promise.all(
      consituencyCandidateList.map(
        async ({ consituencyId, candidateList }) =>
          await Promise.all(
            candidateList.map(async candidateId => {
              const candidate = await getCandidate(address, candidateId);
              const consituency = await getConsituency(address, consituencyId);
              return {
                consituencyId: consituencyId,
                consituencyName: consituency.name,
                candidateId: candidateId,
                candidateName: candidate.name,
                candidateParty: candidate.party,
                votes: await getCandidateVotes(
                  address,
                  consituencyId,
                  candidateId
                )
              };
            })
          )
      )
    );

    // merge the nested arrays in one using reduce and concat
    electionData = [].concat(...electionData);
    //  console.log("Votes---> ", votes);
    return electionData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const electionResult = async address => {
  try {
    const electionDataArr = await electionData(address);
    const consituencyList = [
      ...new Set(electionDataArr.map(obj => obj.consituencyId))
    ];
    //console.log(consituencyList);
    let partyCount = [
      ...new Set(electionDataArr.map(obj => obj.candidateParty))
    ].map((party, index) => ({
      party: party,
      count: 0,
      index: index
    }));
    //console.log(partyCount);

    consituencyList.forEach(consituencyId => {
      const data = electionDataArr.filter(
        obj => obj.consituencyId == consituencyId
      );

      let maxVotes = 0;
      let party;

      data.forEach(obj => {
        if (maxVotes <= obj.votes) {
          maxVotes = obj.votes;
          party = obj.candidateParty;
        }
      });
      // console.log("win party", maxVotes, party);

      partyCount.forEach(obj => {
        if (obj.party === party) {
          obj.count++;
        }
      });
    });
    //console.log("PAr", partyCount);
    let winningParty;
    let winningSeats = 0;
    partyCount.forEach(obj => {
      if (winningSeats < obj.count) {
        winningSeats = obj.count;
        winningParty = obj.party;
      }
    });
    //console.log(winningParty, winningSeats, "----><");
    return [partyCount, winningParty, winningSeats];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  getAccounts,
  createElection,
  getConductedElections,
  getElectionAddress,
  getElectionAdmin,
  getElectionName,
  addConsituency,
  getConsituencyList,
  getConsituency,
  addVoter,
  getVoterList,
  getVoter,
  addCandidate,
  getCandidateList,
  getCandidate,
  getConsituencyCandidates,
  getVoterConsituencyCandidates,
  castVote,
  getCandidateVotes,
  closeElection,
  electionResult,
  electionData
};
