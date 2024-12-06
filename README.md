<p align="center">
  <img height="200" src=".github/growfy-logo.png" alt="Growfy" />
</p>

> [!NOTE]  
> This repository is purely made to manage the business logic and main core functions of the platform. Before comitting anything, please open a pull request.

> [!IMPORTANT]  
> ### Project Setup
> Follow the instructions bellow to get started and setup this project locally

```bash
$ yarn install
$ bun install
```

> [!WARN]  
> You must have an instance of PostgreSQL and Redis running on your system, highly recommended to use [Docker](https://www.docker.com/products/docker-desktop/)

Once this is covered, we must migrate the database and seeds to our PostgreSQL local instance, you can do just as follow:
```bash
$ npx prisma migrate dev
```

Make sure to generate a new env file with the following command

```bash
$ cp .env.example .env
```

And fill the required information.

## Compile and run the project

```bash
# development
$ yarn start
$ bun start

# watch mode
$ yarn dev
$ bun dev

# production mode
$ yarn prod
$ bun prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.