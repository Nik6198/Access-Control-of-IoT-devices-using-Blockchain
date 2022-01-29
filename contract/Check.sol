pragma solidity >=0.4.21 <0.6.0;
contract edd {
  
    bytes32[] public MemberAddresses;
   
    function addMember (bytes32 newAddress) public  {
        MemberAddresses.push(newAddress);   
  
    }
   
    function getElements() public view returns  (bytes32[] memory) {
       
       return MemberAddresses;
       
   }
  
    function find (bytes32 findAddress) public view returns (bool) {
        uint flag =0;
        for (uint i; i< MemberAddresses.length;i++){
          if (MemberAddresses[i]==findAddress)
          {
             flag=1;
          }
        }
          if(flag==1)
          return true;
          else
          return false;
     
    }
}


