import React, { Component } from "react";

import NavbarAdmin from "../../Navbar/NavigationAdmin";
import Navbar from "../../Navbar/Navigation";

import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

import "./AdminManager.css";

export default class AdminManager extends Component {
  state = {
    web3: null,
    account: null,
    contract: null,
    isAdmin: false,
    isSuperAdmin: false,
    inputAddress: "",
    checkResult: "",
  };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];

      const contract = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      const isAdmin = await contract.methods
        .isAdmin(accounts[0])
        .call();

      const superAdmin = await contract.methods.getAdmin().call();

      this.setState({
        web3,
        account: accounts[0],
        contract,
        isAdmin,
        isSuperAdmin: accounts[0].toLowerCase() === superAdmin.toLowerCase(),
      });

    } catch (err) {
      console.error(err);
      alert("Error loading contract");
    }
  };

  updateAddress = (e) => {
    this.setState({ inputAddress: e.target.value });
  };

  // 🔥 ADD ADMIN
  addAdmin = async () => {
    try {
      await this.state.contract.methods
        .addAdmin(this.state.inputAddress)
        .send({ from: this.state.account });

      alert("Admin added successfully ✅");
    } catch (err) {
      alert("Only Super Admin can add ❌");
    }
  };

  // 🔥 REMOVE ADMIN
  removeAdmin = async () => {
    try {
      await this.state.contract.methods
        .removeAdmin(this.state.inputAddress)
        .send({ from: this.state.account });

      alert("Admin removed ❌");
    } catch (err) {
      alert("Only Super Admin can remove ❌");
    }
  };

  // 🔥 CHECK ADMIN
  checkAdmin = async () => {
    try {
      const result = await this.state.contract.methods
        .isAdmin(this.state.inputAddress)
        .call();

      this.setState({
        checkResult: result ? "✅ Is Admin" : "❌ Not Admin",
      });
    } catch (err) {
      alert("Invalid address");
    }
  };

  render() {
    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}

        <div className="admin-container">
          <h1>Admin Governance Panel</h1>

          <p className="role-tag">
            {this.state.isSuperAdmin
              ? "👑 Super Admin"
              : "🛠 Admin"}
          </p>

          <input
            type="text"
            placeholder="Enter Wallet Address"
            value={this.state.inputAddress}
            onChange={this.updateAddress}
          />

          <div className="btn-group">
            <button onClick={this.addAdmin}>Add Admin</button>
            <button onClick={this.removeAdmin}>Remove Admin</button>
            <button onClick={this.checkAdmin}>Check</button>
          </div>

          <p className="result">{this.state.checkResult}</p>
        </div>
      </>
    );
  }
}