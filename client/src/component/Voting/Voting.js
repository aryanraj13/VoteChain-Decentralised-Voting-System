// Node modules
import React, { Component } from "react";
import { Link } from "react-router-dom";
import Web3 from "web3";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

// CSS
import "./Voting.css";

export default class Voting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      voterToken: null,
      voteReceipt: null,
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      candidateCount: 0,
      candidates: [],
      isElStarted: false,
      isElEnded: false,

      // 🔥 NEW MODAL STATES
      showCommitModal: false,
      showRevealModal: false,
      secretInput: "",
      selectedCandidate: null,

      currentVoter: {
        address: undefined,
        name: null,
        phone: null,
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
    };
  }

  generateVoteHash = (candidateId, secret) => {
    const web3 = new Web3(window.ethereum);
    return web3.utils.soliditySha3(
      { type: "uint256", value: candidateId },
      { type: "string", value: secret }
    );
  };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];

      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({
        web3,
        ElectionInstance: instance,
        account: accounts[0],
      });

      const candidateCount = await instance.methods.getTotalCandidate().call();

      let candidates = [];
      for (let i = 0; i < candidateCount; i++) {
        const c = await instance.methods.candidateDetails(i).call();
        candidates.push({
          id: c.candidateId,
          header: c.header,
          slogan: c.slogan,
        });
      }

      const start = await instance.methods.getStart().call();
      const end = await instance.methods.getEnd().call();

      const voter = await instance.methods.voterDetails(accounts[0]).call();

      const token = await instance.methods.voterToken(accounts[0]).call();

      const receipt = await instance.methods.voteReceipts(accounts[0]).call();

      const admin = await instance.methods.getAdmin().call();

      this.setState({
        candidates,
        candidateCount,
        isElStarted: start,
        isElEnded: end,
        voterToken: token,
        voteReceipt: receipt,
        isAdmin: accounts[0].toLowerCase() === admin.toLowerCase(),
        currentVoter: {
          address: voter.voterAddress,
          name: voter.name,
          phone: voter.phone,
          hasVoted: voter.hasVoted,
          isVerified: voter.isVerified,
          isRegistered: voter.isRegistered,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Error loading contract");
    }
  };

  // 🔥 COMMIT CONFIRM
  handleCommit = async () => {
    const { selectedCandidate, secretInput } = this.state;

    if (!secretInput) return alert("Enter secret");

    const voteHash = this.generateVoteHash(selectedCandidate, secretInput);

    try {
      await this.state.ElectionInstance.methods
        .commitVote(voteHash)
        .send({ from: this.state.account });

      localStorage.setItem("voteSecret", secretInput);
      localStorage.setItem("voteCandidate", selectedCandidate);

      this.setState({
        showCommitModal: false,
        secretInput: "",
      });

      alert("Vote committed ✅");
    } catch (err) {
      console.error(err);
      alert("Commit failed ❌");
    }
  };

  // 🔥 REVEAL CONFIRM
  handleReveal = async () => {
    const secret = this.state.secretInput;
    const candidateId = localStorage.getItem("voteCandidate");

    try {
      await this.state.ElectionInstance.methods
        .revealVote(candidateId, secret)
        .send({ from: this.state.account });

      const receipt = await this.state.ElectionInstance.methods
        .voteReceipts(this.state.account)
        .call();

      this.setState({
        voteReceipt: receipt,
        showRevealModal: false,
        secretInput: "",
      });

      alert("Vote revealed 🎉");
    } catch (err) {
      console.error(err);
      alert("Reveal failed ❌");
    }
  };

  renderCandidates = (c) => {
    return (
      <div key={c.id} className="container-item">
        <div className="candidate-info">
          <h2>
            {c.header} <small>#{c.id}</small>
          </h2>
          <p>{c.slogan}</p>
        </div>

        <div className="vote-btn-container">
          <button
            className="vote-bth"
            onClick={() =>
              this.setState({
                showCommitModal: true,
                selectedCandidate: c.id,
              })
            }
          >
            Commit Vote
          </button>

          <button
            onClick={() =>
              this.setState({
                showRevealModal: true,
                secretInput:
                  localStorage.getItem("voteSecret") || "",
              })
            }
          >
            Reveal Vote
          </button>
        </div>
      </div>
    );
  };

  render() {
    if (!this.state.web3) return <center>Loading...</center>;

    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}

        <div className="container-main">
          <h2>Candidates</h2>

          {this.state.candidates.map(this.renderCandidates)}
        </div>

        {/* 🔥 COMMIT MODAL */}
        {this.state.showCommitModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Enter Secret 🔐</h3>
              <input
                value={this.state.secretInput}
                onChange={(e) =>
                  this.setState({ secretInput: e.target.value })
                }
              />
              <div className="modal-actions">
                <button onClick={this.handleCommit}>Confirm</button>
                <button
                  className="cancel"
                  onClick={() =>
                    this.setState({ showCommitModal: false })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 REVEAL MODAL */}
        {this.state.showRevealModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Reveal Vote 🔓</h3>
              <input
                value={this.state.secretInput}
                onChange={(e) =>
                  this.setState({ secretInput: e.target.value })
                }
              />
              <div className="modal-actions">
                <button onClick={this.handleReveal}>Reveal</button>
                <button
                  className="cancel"
                  onClick={() =>
                    this.setState({ showRevealModal: false })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}