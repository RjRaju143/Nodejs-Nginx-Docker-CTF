# pull the Node.js Docker image
FROM node:18.9.0-slim

# Creating working dir
RUN mkdir -p /app

# create the directory inside the container
WORKDIR /app

# copy the package.json files from local machine to the workdir in container
COPY package*.json ./

# run npm install in our local machine
#RUN npm install -g npm@8.19.1
RUN npm install

# copy the generated modules and all other files to the container
COPY . .

# changing user ownership
RUN chown www-data:www-data -R /app

# non-prev.. user
USER www-data

# Environment
ENV SESSION_SECRET = "@#$%^&*jycRSFCDTFVYBU67564"

# our app is running on port 8800 within the container, so need to expose it
EXPOSE 8000

# the command that starts our app
CMD ["node", "server.js"]
