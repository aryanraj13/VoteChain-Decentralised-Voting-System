import React, { Component } from "react";
import NavbarAdmin from "./Navbar/NavigationAdmin";
import getWeb3 from "../getWeb3";
import Election from "../contracts/Election.json";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./Dashboard.css";

export default class Dashboard extends Component {
  state = {
    candidates: [],
    totalVotes: 0,
    isLive: false,
  };

  interval = null;

  // 🔥 CENTRAL FUNCTION (USED FOR REAL-TIME UPDATES)
  loadBlockchainData = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];

      if (!deployedNetwork) {
        console.error("Contract not deployed on this network");
        return;
      }

      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork.address
      );

      const count = await instance.methods.getTotalCandidate().call();

      let candidates = [];
      let totalVotes = 0;

      for (let i = 0; i < count; i++) {
        const c = await instance.methods.candidateDetails(i).call();
        const votes = parseInt(c.voteCount);

        totalVotes += votes;

        candidates.push({
          name: c.header,
          votes,
        });
      }

      // election status
      const start = await instance.methods.getStart().call();
      const end = await instance.methods.getEnd().call();

      this.setState({
        candidates,
        totalVotes,
        isLive: start && !end,
      });

    } catch (error) {
      console.error("Dashboard error:", error);
    }
  };

  // 🔥 START AUTO REFRESH
  componentDidMount = async () => {
    await this.loadBlockchainData();

    // 🔁 AUTO UPDATE EVERY 3 SECONDS
    this.interval = setInterval(() => {
      this.loadBlockchainData();
    }, 3000);
  };

  // 🛑 CLEANUP
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const { candidates, totalVotes, isLive } = this.state;

    const colors = ["#4F46E5", "#F97316"];

    return (
      <>
        <NavbarAdmin />

        <div className="dash-container">
          <div className="dash-header">
            <h1>Real-Time Election Dashboard</h1>

            <div className={`status-badge ${isLive ? "live" : "closed"}`}>
              {isLive ? "🟢 Election is Live" : "🔴 Election Closed"}
            </div>
          </div>

          {/* TOP CARDS */}
          <div className="top-cards">
            <div className="card purple">
              <p>Total Votes</p>
              <h2>{totalVotes}</h2>
            </div>

            {candidates.map((c, i) => (
              <div className={`card ${i === 0 ? "blue" : "orange"}`} key={i}>
                <p>{c.name}</p>
                <h2>{c.votes}</h2>
              </div>
            ))}
          </div>

          {/* MAIN SECTION */}
          <div className="main-grid">

            {/* LEFT */}
            <div className="card large">
              <h3>Candidate Performance</h3>

              {candidates.map((c, i) => (
                <div className="row" key={i}>
                  <span>{c.name}</span>
                  <span>{c.votes}</span>
                </div>
              ))}
            </div>

            {/* CENTER */}
            <div className="card large">
              <h3>Live Voting Analytics</h3>

              {candidates.map((c, i) => {
                const percent =
                  totalVotes === 0
                    ? 0
                    : ((c.votes / totalVotes) * 100).toFixed(2);

                return (
                  <div
                    key={i}
                    className={`percent-card ${
                      i === 0 ? "blue" : "orange"
                    }`}
                  >
                    <h2>{percent}%</h2>
                    <p>{c.name}</p>
                  </div>
                );
              })}
            </div>

            {/* RIGHT */}
            <div className="card large">
              <h3>Live Voting Analytics</h3>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={candidates}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="votes">
                    {candidates.map((entry, index) => (
                      <Cell key={index} fill={colors[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE */}
          <div className="card large">
            <h3>Vote Distribution</h3>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={candidates}
                  dataKey="votes"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {candidates.map((entry, index) => (
                    <Cell key={index} fill={colors[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  }
}