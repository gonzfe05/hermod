# hermod image doesn't have the installation requirements duckling so we use the duckling docker image
# note the need to pass the DUCKLING_URL to hermod
docker kill duckling
docker rm duckling
docker run -p 8000:8000 --name duckling rasa/duckling &


docker kill hermodpython
docker rm hermodpython
# pass docker host ip to container for duckling url and pulse server
MYIP=`ip -4 route get 8.8.8.8 | awk {'print $7'} | tr -d '\n'`
DUCKLING_URL="http://$MYIP:8000"
RASA_URL="http://$MYIP:5005"

docker run --name hermodpython --privileged  -e RASA_URL=$RASA_URL -e DUCKLING_URL=$DUCKLING_URL -e PULSE_SERVER=$MYIP -e PULSE_COOKIE=/tmp/cookie  -v $(cd ~ && pwd)/.config/pulse/cookie:/tmp/cookie -v $(pwd)/../hermod-python/rasa:/app/rasa -v $(pwd)/../hermod-python/www:/app/www -v /dev/snd:/dev/snd -v $(pwd)/../hermod-python/src:/app/src -v $(pwd)/../hermod-python/mosquitto:/etc/mosquitto -v $(pwd)/../hermod-python/certs:/etc/certs  -v /etc/letsencrypt:/etc/letsencrypt  -v /etc/ssl:/etc/ssl  -p 1883:1883   -p 8080:80   -p 8443:443  -p 9001:9001  -p 5005:5005 -w /app/rasa  --entrypoint bash -it syntithenai/hermod-python 
         
            
