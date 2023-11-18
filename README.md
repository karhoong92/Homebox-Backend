![Cover Photo](screenshots/cover_photo.png)

# Homebox-Backend

Homebox-Backend is the express.js back-end system for the Homebox smart home system. It facilitates seamless communication between smart home devices and users, enabling users to control their devices remotely as long as there is a stable internet connection.

## Table of Contents

- [Introduction](#homebox-backend)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Docker](#docker)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Seamless Communication:** Homebox-Backend ensures smooth communication between smart home devices and users.
- **Remote Control:** Users can control their devices from anywhere with a stable internet connection.
- **Scalable:** Built on Express.js, Homebox-Backend is designed for scalability and can accommodate a growing number of devices.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/)

### Installation

1. Clone the repository:
2. Navigate to the project directory:
3. Install dependencies:

### Usage

#### Docker

To run Homebox-Backend using Docker, follow these steps:

1. Create a `.env` file in the root directory with the following content:

   ```
   MONGO_INITDB_ROOT_USERNAME=myuser
   MONGO_INITDB_ROOT_PASSWORD=mypassword
   ```

   Replace `myuser` and `mypassword` with your desired MongoDB credentials.

2. Start the services using Docker Compose:

   ```bash
   docker-compose up -d
   ```

3. The services will be running at the following ports:

   - Homebox-Backend: `http://localhost:15080` (HTTP) and `https://localhost:15443` (HTTPS)

4. Access the MongoDB instance at `mongodb://myuser:mypassword@localhost:49302`

5. Explore the API documentation to integrate Homebox-Backend with your smart home devices.

## API Documentation

For detailed information on available endpoints and how to interact with the API, refer to the [API documentation](./docs/api).

## Contributing

Contributions are not currently accepted for this project.

## License

This project is licensed under the [MIT License](./LICENSE). See the [LICENSE](./LICENSE) file for more details.

**Note:** When using Docker, make sure to update the MongoDB credentials in the `docker-compose.yml` file and `init-mongo.js` script to enhance security. Users are encouraged to choose strong and unique credentials.
