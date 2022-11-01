#!/bin/bash

DATE_TIME=$(date +'%m-%d-%Y_%H:%M:%S')
STATUS=$(systemctl status docker.service | grep -i active | cut -b 9- | cut -d" " -f2)

RED="\e[31m"
GREEN="\e[32m"
NOCOLOR="\033[0m"

banner(){
	echo "Rj Raju" | figlet
	return
}

run_code(){
	echo "Select your option"
	echo "d : detach mode"
	echo "n : non-detach mode"
	read -p "Enter your option : " User_input

	if [[ -d $(pwd)/log ]]; then
		echo "logs path $(pwd)/log"
	else
		mkdir log
		echo "logs path $(pwd)/log"
	fi

	if [[ $User_input == d ]]; then
	       echo ""
	       echo "Running detach mode"
	       echo ""
	       docker-compose up --build -d | tee log/${DATE_TIME}_detach_mode_log.txt
	elif [[ $User_input == n ]]; then
	       echo ""
	       echo "Running non-detach mode"
	       echo ""
	       docker-compose up --build | tee log/${DATE_TIME}_non_detach_mode_log.txt
	else
	       echo -e "${GREEN}Exit ... "
	       exit
	fi
	return
}


main_code(){
	if [[ $UID = 0 ]]; then
		if [[ -e $(which docker) && $(which docker-compose) ]]; then
			if [[ $STATUS == inactive ]]; then
				echo -e "${RED}Docker is $STATUS ${NOCOLOR}"
				read -p "Do you want to start docker.service (yes/no) Default no : " INPUT
				if [[ $INPUT == yes ]]; then
					systemctl start docker.service
					echo "Docker is active"
					run_code
				elif [[ $INPUT == no ]]; then
						echo "docker not started ."
				else
					echo "docker not started ."
				fi
			elif [[ $STATUS == active ]]; then
				echo "Docker is $STATUS"
				run_code
			fi
		else
			read -p "Do you want to install docker and docker-compose (yes/no) Default no : " INSTALL
			if [[ $INSTALL == yes ]]; then
				apt-get install docker.io -y && apt-get install docker-compose -y
				echo ""
				run_code
			fi
		fi
	else
		echo ""
		echo -e "${RED}run as root"
		echo ""
	fi
	return
}


banner
main_code

