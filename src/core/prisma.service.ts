import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleInit } from '@nestjs/common';
import configLoader from 'src/lib/ConfigLoader';

/**
 * PrismaService manages the connection to the database.
 * It should be injected into classes requiring database access.
 * For detailed Prisma documentation, visit: https://pris.ly/d/prisma-schema
 */

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	constructor() {
		const { database } = configLoader();

		const datasourceUrl = PrismaService.constructDatasourceUrl(database);
		super({
			datasources: {
				db: { url: datasourceUrl },
			},
		});
	}

	/**
	 * Initializes the PrismaService by establishing the database connection.
	 */
	async onModuleInit(): Promise<void> {
		await this.$connect();
	}

	/**
	 * Constructs the datasource URL for the database connection.
	 * @param database - The database configuration object.
	 * @returns The constructed datasource URL.
	 */
	private static constructDatasourceUrl(database: {
		user: string;
		password: string;
		host: string;
		port: number;
		name: string;
	}): string {
		return `postgresql://${database.user}:${database.password}@${database.host}:${database.port}/${database.name}?schema=public`;
	}
}
