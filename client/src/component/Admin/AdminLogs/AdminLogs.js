import React, { Component } from "react";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

import "./AdminLogs.css";

export default class AdminLogs extends Component {
  state = {
    logs: [],
  };

  componentDidMount = async () => {
    const web3 = await getWeb3();
    const accounts = await web3.eth.getAccounts();

    const networkId = await web3.eth.net.getId();
    const deployedNetwork = Election.networks[networkId];

    const contract = new web3.eth.Contract(
      Election.abi,
      deployedNetwork.address
    );

    const count = await contract.methods.getLogCount().call();

    let logs = [];

    for (let i = 0; i < count; i++) {
      const log = await contract.methods.getLog(i).call();

      logs.push({
        admin: log[0],
        action: log[1],
        time: new Date(log[2] * 1000).toLocaleString(),
      });
    }

    this.setState({ logs: logs.reverse() }); // latest first
  };

  render() {
    return (
      <>
        <NavbarAdmin />

        <div className="log-container">
          <h2>Admin Activity Logs</h2>

          {this.state.logs.length === 0 ? (
            <p>No logs yet</p>
          ) : (
            this.state.logs.map((log, index) => (
              <div key={index} className="log-card">
                <p><b>Admin:</b> {log.admin}</p>
                <p><b>Action:</b> {log.action}</p>
                <p><b>Time:</b> {log.time}</p>
              </div>
            ))
          )}
        </div>
      </>
    );
  }
}