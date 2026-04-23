// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.9.0;

contract Election {
    address public superAdmin;
    mapping(address => bool) public admins;

    uint256 candidateCount;
    uint256 voterCount;
    bool start;
    bool end;

    // 🔥 ADMIN LOG STRUCT
    struct AdminLog {
        address admin;
        string action;
        uint256 timestamp;
    }

    AdminLog[] public adminLogs;

    constructor() public {
        superAdmin = msg.sender;
        admins[msg.sender] = true;
    }

    // 🔥 ADD LOG FUNCTION
    function addLog(string memory _action) internal {
        adminLogs.push(AdminLog(msg.sender, _action, block.timestamp));
    }

    // 🔥 GET LOGS
    function getLogCount() public view returns (uint256) {
        return adminLogs.length;
    }

    function getLog(uint256 index)
        public
        view
        returns (address, string memory, uint256)
    {
        AdminLog memory log = adminLogs[index];
        return (log.admin, log.action, log.timestamp);
    }

    // ================= ADMIN CONTROL =================
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin");
        _;
    }

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Only super admin");
        _;
    }

    function isAdmin(address user) public view returns (bool) {
        return admins[user];
    }

    function addAdmin(address newAdmin) public onlySuperAdmin {
        admins[newAdmin] = true;
        addLog("Added Admin");
    }

    function removeAdmin(address adminAddr) public onlySuperAdmin {
        admins[adminAddr] = false;
        addLog("Removed Admin");
    }

    function getAdmin() public view returns (address) {
        return superAdmin;
    }

    // ================= CANDIDATES =================
    struct Candidate {
        uint256 candidateId;
        string header;
        string slogan;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidateDetails;

    function addCandidate(string memory _header, string memory _slogan)
        public
        onlyAdmin
    {
        candidateDetails[candidateCount] = Candidate(
            candidateCount,
            _header,
            _slogan,
            0
        );
        candidateCount++;

        addLog("Added Candidate");
    }

    function getTotalCandidate() public view returns (uint256) {
        return candidateCount;
    }

    // ================= ELECTION DETAILS =================
    struct ElectionDetails {
        string adminName;
        string adminEmail;
        string adminTitle;
        string electionTitle;
        string organizationTitle;
    }

    ElectionDetails electionDetails;

    function setElectionDetails(
        string memory _adminName,
        string memory _adminEmail,
        string memory _adminTitle,
        string memory _electionTitle,
        string memory _organizationTitle
    ) public onlyAdmin {
        electionDetails = ElectionDetails(
            _adminName,
            _adminEmail,
            _adminTitle,
            _electionTitle,
            _organizationTitle
        );
        start = true;
        end = false;

        addLog("Started Election");
    }

    function getElectionDetails()
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory
        )
    {
        return (
            electionDetails.adminName,
            electionDetails.adminEmail,
            electionDetails.adminTitle,
            electionDetails.electionTitle,
            electionDetails.organizationTitle
        );
    }

    function getTotalVoter() public view returns (uint256) {
        return voterCount;
    }

    // ================= VOTERS =================
    struct Voter {
        address voterAddress;
        string name;
        string phone;
        bool isVerified;
        bool hasVoted;
        bool isRegistered;
    }

    address[] public voters;
    mapping(address => Voter) public voterDetails;

    function registerAsVoter(string memory _name, string memory _phone)
        public
    {
        voterDetails[msg.sender] = Voter(
            msg.sender,
            _name,
            _phone,
            false,
            false,
            true
        );

        voters.push(msg.sender);
        voterCount++;
    }

    // ================= TOKEN SYSTEM =================
    mapping(address => uint256) public voterToken;
    mapping(uint256 => bool) public tokenUsed;
    uint256 public tokenCounter = 1;

    function verifyVoter(bool _status, address voterAddress)
        public
        onlyAdmin
    {
        voterDetails[voterAddress].isVerified = _status;

        if (_status && voterToken[voterAddress] == 0) {
            voterToken[voterAddress] = tokenCounter;
            tokenCounter++;
        }

        addLog("Verified Voter");
    }

    // ================= COMMIT-REVEAL =================
    mapping(address => bytes32) public voteHashes;
    mapping(address => bool) public hasCommitted;

    function commitVote(bytes32 _voteHash) public {
        require(voterDetails[msg.sender].isVerified, "Not verified");
        require(!hasCommitted[msg.sender], "Already committed");
        require(start && !end, "Election inactive");

        uint256 token = voterToken[msg.sender];
        require(token != 0, "No token assigned");

        voteHashes[msg.sender] = _voteHash;
        hasCommitted[msg.sender] = true;
    }

    // ================= RECEIPTS =================
    mapping(address => bytes32) public voteReceipts;

    function revealVote(uint256 candidateId, string memory secret) public {
        require(hasCommitted[msg.sender], "No commit found");
        require(!voterDetails[msg.sender].hasVoted, "Already voted");

        uint256 token = voterToken[msg.sender];
        require(!tokenUsed[token], "Token already used");

        bytes32 computedHash = keccak256(
            abi.encodePacked(candidateId, secret)
        );

        require(computedHash == voteHashes[msg.sender], "Invalid reveal");

        candidateDetails[candidateId].voteCount++;
        voterDetails[msg.sender].hasVoted = true;
        tokenUsed[token] = true;

        bytes32 receipt = keccak256(
            abi.encodePacked(msg.sender, candidateId, secret, block.timestamp)
        );

        voteReceipts[msg.sender] = receipt;
    }

    // ================= OPTIONAL OLD METHOD =================
    function vote(uint256 candidateId) public {
        require(!voterDetails[msg.sender].hasVoted);
        require(voterDetails[msg.sender].isVerified);
        require(start && !end);

        candidateDetails[candidateId].voteCount++;
        voterDetails[msg.sender].hasVoted = true;
    }

    // ================= END ELECTION =================
    function endElection() public onlyAdmin {
        end = true;
        start = false;

        addLog("Ended Election");
    }

    function getStart() public view returns (bool) {
        return start;
    }

    function getEnd() public view returns (bool) {
        return end;
    }
}