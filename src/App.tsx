import { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import Container from 'react-bootstrap/Container';
import { Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils'
import {TOKEN_ADDR, TOKEN_DECIMAL, CONTRACT_ADDR} from './config.js'

declare let window: any;

const DEFAULT_WALLET = "CONNECT";
const CHAIN_ID = '0x38';
let web3 = new Web3(window.ethereum)

export default function App() {
  const [walletAddress, setWalletAddress] = useState(DEFAULT_WALLET);
  const [allowance, setAllowance] = useState(-1);
  const [tokenCount, setTokenCount] = useState(0)

  const [totalStaked, setTotalStaked] = useState(0);
  const [totalExpected, setTotalExpected] = useState(0);
  const [totalClaimed, setTotalClaimed] = useState(0)
  const [claimalbe, setClaimable] = useState(0);

  const [limitStakeTokens, setLimitStakeTokens] = useState(0);
  const [totalStakedTokens, setTotalStakedTokens] = useState(0);

  const getChainId = async () => {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId;
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed!')
    }

    /*** check if it is on BSC network***/
    const chainId = await getChainId()
    if (chainId !== CHAIN_ID) {
      alert('wrong network!')
      return
    }

    /*** metamask connecting ***/
    window.ethereum.request({
      method: 'eth_requestAccounts'
    }).then((accounts: any) => {
      setWalletAddress(accounts[0])
    }).catch(() => {

    })
  }

  const approve = async () => {
    const approveAbi = [
      {
        "constant":false,
        "inputs":[
          {
            "internalType":"address",
            "name":"spender","type":"address"
          },
          {
            "internalType":"uint256",
            "name":"amount","type":"uint256"
          }
        ],
        "name":"approve",
        "outputs":[
          {
            "internalType":"bool",
            "name":"","type":"bool"
          }
        ],
        "payable":false,
        "stateMutability":"nonpayable",
        "type":"function"
      }
    ]
    const tokenContract = new web3.eth.Contract(approveAbi as AbiItem[], TOKEN_ADDR);
    await tokenContract.methods.approve(CONTRACT_ADDR, '1000000000000000000000000000000000000000000000000000000000000000000000000000000000').send(
      {from: walletAddress}
    )
    getAllowance(walletAddress);
  }

  const stake = async () => {
    const creatStakeAbi = [
      {
        "inputs":[
          {
            "internalType":"uint256",
            "name":"_amount","type":"uint256"
          }
        ],
        "name":"createStake",
        "outputs":[],
        "stateMutability":"nonpayable",
        "type":"function"
      }
    ]
    const stakeContract = new web3.eth.Contract(creatStakeAbi as AbiItem[], CONTRACT_ADDR);
    await stakeContract.methods.createStake(tokenCount).send(
      {from: walletAddress}
    )
    getAllowance(walletAddress);
    getStakeStatus(walletAddress);
  }

  const reward = async () => {
    const rewardAbi = [
      {
        "inputs":[],
        "name":"rewardDailyEarning",
        "outputs":[],
        "stateMutability":"nonpayable",
        "type":"function"
      }
    ]
    const stakeContract = new web3.eth.Contract(rewardAbi as AbiItem[], CONTRACT_ADDR);
    await stakeContract.methods.rewardDailyEarning().send(
      {from: walletAddress}
    )
    getAllowance(walletAddress);
    getStakeStatus(walletAddress);
  }

  const getAllowance = async (walletAddr: any) => {
    const allowanceAbi = [
      {
        "constant":true,
        "inputs":[
          {
            "internalType":"address",
            "name":"owner",
            "type":"address"
          },
          {
            "internalType":"address",
            "name":"spender",
            "type":"address"
          }
        ],
        "name":"allowance",
        "outputs":[
          {
            "internalType":"uint256",
            "name":"",
            "type":"uint256"
          }
        ],
        "payable":false,
        "stateMutability":"view",
        "type":"function"
      }
    ]
    
    const tokenContract = new web3.eth.Contract(allowanceAbi as AbiItem[], TOKEN_ADDR);
    tokenContract.methods.allowance(walletAddr, CONTRACT_ADDR).call(
    ).then((res: number) => {
      setAllowance(Number(res));
    });
  }

  const getStakeStatus = async (walletAddr: any) => {
    const stakeStatusAbi = [
      {
        "inputs":[],
        "name":"stakeStatus",
        "outputs":[
          {
            "internalType":"string",
            "name":"",
            "type":"string"
          }
        ],
        "stateMutability":"view",
        "type":"function"
      }
    ]
    const stakeContract = new web3.eth.Contract(stakeStatusAbi as AbiItem[], CONTRACT_ADDR);
    try {
      let res = await stakeContract.methods.stakeStatus().call(
        {from: walletAddr}
      )
  
      console.log(res)
      if (res.length > 0) {
        res = res.replace(/{/g, '[');
        res = res.replace(/}/g, ']');
        res = '{"stakeInfo": [' + res +']}';
        const obj = JSON.parse(res);
  
        if (obj.stakeInfo !== undefined) {
          let a= [0,0,0,0];
          for (let index = 0; index < obj.stakeInfo.length; index++) {
            a[0] = a[0] + obj.stakeInfo[index][0];
            a[1] = a[1] + obj.stakeInfo[index][1];
            a[2] = a[2] + obj.stakeInfo[index][4];
            a[3] = a[3] + obj.stakeInfo[index][5];
          }
          setTotalClaimed(a[0]);
          setTotalStaked(a[1]);
          setTotalExpected(a[2]);
          setClaimable(a[3]);
        }
      } else {
        setTotalClaimed(0);
        setTotalStaked(0);
        setTotalExpected(0);
        setClaimable(0);
      }
      
    } catch (error) {
      setTotalClaimed(0);
      setTotalStaked(0);
      setTotalExpected(0);
      setClaimable(0);
    }
    
  }

  const getTotalOfContract = async () => {
    const totalOfContractAbi = [
      {
        "inputs":[],
        "name":"totalStakedTokens",
        "outputs":[
          {
            "internalType":"uint256",
            "name":"","type":"uint256"
          }
        ],
        "stateMutability":"view",
        "type":"function"
      }
    ]
    
    const contractContract = new web3.eth.Contract(totalOfContractAbi as AbiItem[], CONTRACT_ADDR);
    contractContract.methods.totalStakedTokens().call(
    ).then((res: number) => {
      setTotalStakedTokens(res);
    });
  }

  const getLimitStake = async () => {
    const limitStakeTokens = [
      {
        "inputs":[],
        "name":"limitStakeTokens",
        "outputs":[
          {
            "internalType":"uint256",
            "name":"","type":"uint256"
          }
        ],
        "stateMutability":"view",
        "type":"function"}
    ]
    
    const contractContract = new web3.eth.Contract(limitStakeTokens as AbiItem[], CONTRACT_ADDR);
    contractContract.methods.limitStakeTokens().call(
    ).then((res: number) => {
      setLimitStakeTokens(res);
    });
  }

  useEffect(() => {  
    if (walletAddress === DEFAULT_WALLET) {
      setAllowance(-1);
      setTotalClaimed(0);
      setTotalStaked(0);
      setTotalExpected(0);
      setClaimable(0);

      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed!')
      }
  
      /***** when chain Network is changed *****/
      window.ethereum.on('chainChanged', (chainId: any) => {
        if (chainId !== CHAIN_ID) {
          alert('wrong network!')
        } else {
        }
      });
  
      /***** when account is changed *****/
      window.ethereum.on('accountsChanged', (accounts: any) => {
        if (accounts[0]) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(DEFAULT_WALLET);
        }
      })
  
      window.ethereum.request({
        method: 'eth_accounts'
      }).then((accounts: any) => {
        const addr = (accounts.length <= 0) ? DEFAULT_WALLET : accounts[0];
        if (accounts.length > 0) {
          setWalletAddress(addr);
        } else {
          setWalletAddress(DEFAULT_WALLET);
        }
      })
    } else if (walletAddress !== "") {
      getAllowance(walletAddress);
      getStakeStatus(walletAddress);
      getLimitStake();
      getTotalOfContract();
    }
  }, [walletAddress]);

  return (
    <div className='main_page'>
      <Container>
        <Row className="justify-content-md-center">
          <Col className="mt-5">LOGO</Col>
          <Col className="justify-content-md-center mt-5">
            <Button className="float-right" variant="contained" color="primary" onClick={connectWallet}>{(walletAddress === 'CONNECT') ? walletAddress : (walletAddress.substring(0, 7) + "..." + walletAddress.slice(-4))}</Button>
          </Col>
        </Row>

        <Row className="justify-content-md-center">
          <Col className="mt-2 mb-2 text-center main_page_heading">Welcome To Our Website</Col>
        </Row>


        <div className="col-md-12">
          <div className="row">
            <div className="col-md-4"></div>
            <div className="col-md-4">
              <div className="staking_form">
                <div className="form-group">
                  {(allowance === 0) && <label>Sign Approval</label>}
                  {(allowance > 0) && <label>Stake tokens</label>}
                  <input type="number" className="form-control" placeholder="Tokens Of Planned to Stake" value={tokenCount} onChange={(e) => setTokenCount(Number(e.target.value))}/>
                </div>
                {(allowance < 0) && <Button className="submit_btn" onClick={connectWallet}>Connect</Button>}
                {(allowance === 0) && <Button className="submit_btn" onClick={approve}>Approve</Button>}
                {(allowance > 0) && <Button className="submit_btn" onClick={stake} style={{marginLeft: "10px"}} color="primary">Stake</Button>}
                <p>
                  Running Contract : 
                  <a href={"https://bscscan.com/address/" + CONTRACT_ADDR} target="_blank" rel="noopener noreferrer">{CONTRACT_ADDR.substring(0, 7) + "..." + CONTRACT_ADDR.slice(-4)}</a><br/>
                  Total tokens in stake contract : 
                  <a href={"https://bscscan.com/address/" + CONTRACT_ADDR} target="_blank" rel="noopener noreferrer">{totalStakedTokens / Math.pow(10, TOKEN_DECIMAL)}</a><br/>
                  Stakable Max tokens : 
                  <a href={"https://bscscan.com/address/" + CONTRACT_ADDR} target="_blank" rel="noopener noreferrer">{(limitStakeTokens - totalStakedTokens) / Math.pow(10, TOKEN_DECIMAL)}</a>
                </p>
                {(walletAddress !== "CONNECT") && <Button className="submit_btn" onClick={reward}>Claim Reward</Button>}

              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-2"></div>
            <div className="col-md-8">
              <div className="token_status">
                <div className="row">
                  <div className="col-md-3">
                    <h5>Total Staked Tokens</h5>
                    <p>$ {totalStaked / Math.pow(10, TOKEN_DECIMAL)}</p>
                  </div>
                  <div className="col-md-3">
                    <h5>Total Expected Return</h5>
                    <p>$ {totalExpected / Math.pow(10, TOKEN_DECIMAL)}</p>
                  </div>
                  <div className="col-md-3">
                    <h5>Total Claimed token</h5>
                    <p>$ {totalClaimed / Math.pow(10, TOKEN_DECIMAL)}</p>
                  </div>
                  <div className="col-md-3">
                    <h5>Available tokens to Claim</h5>
                    <p>$ {claimalbe / Math.pow(10, TOKEN_DECIMAL)} 
                      {(claimalbe > 0) && <button onClick={reward}>Claim Now</button>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </Container>
    </div>
  );
}
