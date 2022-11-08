#!/usr/bin/env bash
log_file=./traffic_size.log

function newDump() {
  net_bridge="br-$(docker network ls | grep cn55spider_inside | awk '{print $1}')"
  dump_name="dump_$(date +%F-%H:%M:%S).pcap"
  touch "$dump_name" && echo "[+] $dump_name created"
  tcpdump -U -i "$net_bridge" -s 0 -w "$dump_name" 'tcp dst port 8082 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)' &
  sleep 5
}

newDump
while true; do
  time=$(date "+%Y-%m-%d-%H:%M:%S")
  echo "$time" >>$log_file

  traffic_size=$(du "$dump_name" | awk '{print $1}')
  echo "size of $dump_name : $traffic_size" >>$log_file

  if [ "$traffic_size" -ge 102400 ]; then
    echo "[!] $dump_name was full"
    dump_bak=$dump_name
    killall tcpdump && newDump
    gzip "$dump_bak"
  else
    if [ -f "$dump_name" ]; then
        echo "[-] $(du -sh "$dump_name")"
      else
        newDump
    fi
  fi
  sleep 360
done
