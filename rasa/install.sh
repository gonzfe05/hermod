#!/bin/bash
apt-get -y install git python-pip
pip3 install rasa
pip3 install rasa_nlu[spacy]
python3 -m spacy download en_core_web_md
python3 -m spacy link en_core_web_md en
pip3 install rasa_nlu[tensorflow]
git clone https://github.com/RasaHQ/starter-pack-rasa-stack.git
cd starter-pack-rasa-stack
pip install -r requirements.txt

make train-nlu
make train-core
make action-server &
