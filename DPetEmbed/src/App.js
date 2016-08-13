import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, FormControl, Grid, FormGroup, Form, InputGroup, Input, Table, Checkbox, ControlLabel, Jumbotron, Row, Col, Modal } from 'react-bootstrap';
const contractAddress='0x69De4ADbb566c1c68e8dB1274229adA4A3D9f8A8';
const blockChainView='https://testnet.etherscan.io/address/';
const selection=[
    "Temperament",
    "Name",
    "Owner", //this can be encrypted
    "Address" //this can be encrypted
];
class App extends Component {
  constructor(props){
    super(props);
    this.state={
      addedEncryption:false,
      password:"",
      cost:0,
      show:false,
    };
  }
  onAdditionalEncryption(){
      this.setState({
          addedEncryption:!this.state.addedEncryption
      });
  }
  setPassword(e){
      this.setState({
          password:e.target.value
      });
  }
  onPassword(){
    this.setState({askForPassword: false}, 
        function(){
            this.state.myPasswordFunction(this.state.password);
            this.setState({password:""});
        }
    );
  }
  showModal(){
    this.setState({
      show:true
    });
  }
  hideModal(){
    this.setState({
      show:false
    });
  }
  showPasswordModal(passwordFunction){
    this.setState({
        askForPassword:true,
        myPasswordFunction:passwordFunction
    });
  }
  onId(event){
    this.setState({
        petId:event.target.value
    });
  }
  hidePasswordModal(){
    this.setState({askForPassword: false});
  }
  render(){
      var self=this;
      return(
          <div>
            <Jumbotron>
              <Grid>
                  <h1>DPets</h1>
                  <p>Input and access animal records: decentralized, immutable, and secure.  <a  onClick={this.showModal}>Learn More!</a></p>
              </Grid>
          </Jumbotron>
          <Modal
              show={this.state.show}
              onHide={()=>{this.hideModal();}}
              dialogClassName="custom-modal"
          >
          <Modal.Header closeButton>
              <Modal.Title id="contained-modal-title-lg">About</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <h4>How it works</h4>
              <p>Every pet should have a microchip which uniquely identifies itself.  A scanner can read the microchip and an ID is read.  For example, the ID may be 123.  This ID is then hashed and placed on the Ethereum blockchain.  The unhashed ID serves as a key to encrypt the name and address of the owner: hence the pet itself is needed in order to know who the owner and the address are (they are not public without knowing the ID of the pet).  This is not secure in the same sense that a human medical or banking record is secure; but as addresses are essentially public this is not a major issue.  If the medical records for the pet are not desired to be "public" then they can be encrypted using a key not associated with the microchip (eg, a password provided by the owners). 
              
              The contract that governs this is available at {contractAddress} on the blockchain.  See it <a href={blockChainView+contractAddress} target="_blank">here.</a> </p>
          </Modal.Body>
          <Modal.Footer>
              <Button onClick={this.hideModal}>Close</Button>
          </Modal.Footer>
          </Modal>
          <Modal
              show={this.state.askForPassword}
              onHide={this.cancelPassword}
              dialogClassName="custom-modal"
          >
          <Modal.Body>
              <form onSubmit={(e)=>{e.preventDefault();this.onPassword();}}>
                  <FormGroup>
                      <ControlLabel>Password</ControlLabel>
                      <Input ref={(input)=>{
                              if (input&&input.refs && input.refs.input) {
                                  input.refs.input.focus();
                              }
                          }}
                          type="password" onChange={()=>{this.setPassword();}}/>
                  </FormGroup>
                  <Button bsStyle="primary" onClick={()=>{this.onPassword();}}>Submit</Button>
              </form>
          </Modal.Body>
          
          </Modal>
          <Grid>
              <Row className="show-grid">
                  
                  <Col xs={12} md={6}>
                      {this.state.successSearch?
                          <div size={16}>Hello {this.state.owner}, {this.state.name} is in good hands! Did something new happen in {this.state.name}'s life?  Record it on the right!  Or view current and past events below.</div>
                      :null}
                  </Col>
                  <Col xs={12} md={6}>
                      
                      <FormGroup>
                          <ControlLabel>Type</ControlLabel>
                          <FormControl componentClass="select" placeholder="select" disabled={!this.state.petId} onChange={this.onAttributeType}>
                              {selection.map(function(val, index){
                                  return(<option key={index} value={index}>{val}</option>)
                              })}
                          </FormControl>
                      </FormGroup>
                      
                      <FormGroup>
                          <ControlLabel>Value</ControlLabel>
                          <FormControl type="text" disabled={!this.state.petId}  onChange={this.onAttributeValue}/>
                          
                      </FormGroup>
                      <Checkbox disabled={!this.state.petId} checked={this.state.addedEncryption} onChange={this.onAdditionalEncryption}>Additional Encryption</Checkbox>
                      <Button bsStyle="primary" onClick={this.addAttribute}>Submit New Result (costs {this.state.cost} Ether)</Button>
                      
                  </Col>
                    
              </Row>
              <div className='whiteSpace'></div>
              <Row>
                  {this.state.successSearch?
                  <Col xs={12} md={6}>
                      <Row>
                          <Col xsHidden sm={7}>
                              <b>TimeStamp</b>
                          </Col>
                          <Col xs={6} sm={2}>
                              <b>Attribute</b>
                          </Col>
                          <Col xs={6} sm={3}>
                              <b>Value</b>
                          </Col>
                      </Row>
                      {this.state.historicalData.map(function(val, index){
                          return(
                              <TblRow key={index} timestamp={val.timestamp.toString()} attributeText={val.attributeText}  label={selection[val.attributeType]||"Unknown"} isEncrypted={val.isEncrypted} onDecrypt={self.showPasswordModal}/>
                          );
                      })}

                  </Col>
                  :null}
              </Row>
          </Grid>
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          </div>
      );
  }
}









/*class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}*/

export default App;
