echo "hi"
ip=`hostname -I | cut -f1 -d ' '`
echo $ip
ip=$ip'/24'
echo $ip
nmap -sP $ip | grep "report for"| cut -d " " -f 5,6 > output.txt
cat -n output.txt > out.txt