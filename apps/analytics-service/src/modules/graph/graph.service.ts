import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session, QueryResult } from 'neo4j-driver';

interface Neo4jConfig {
  scheme: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

interface NodeProperties {
  [key: string]: string | number | boolean | null;
}

@Injectable()
export class GraphService implements OnApplicationShutdown {
  private readonly driver: Driver;
  private readonly database: string;

  constructor(private configService: ConfigService) {
    // Récupération et vérification de chaque variable d'environnement
    const scheme = this.configService.get<string>('NEO4J_SCHEME');
    if (!scheme) {
      throw new Error('NEO4J_SCHEME is not defined');
    }

    const host = this.configService.get<string>('NEO4J_HOST');
    if (!host) {
      throw new Error('NEO4J_HOST is not defined');
    }

    const portStr = this.configService.get<string>('NEO4J_PORT');
    if (!portStr) {
      throw new Error('NEO4J_PORT is not defined');
    }
    const port = parseInt(portStr, 10);

    const username = this.configService.get<string>('NEO4J_USERNAME');
    if (!username) {
      throw new Error('NEO4J_USERNAME is not defined');
    }

    const password = this.configService.get<string>('NEO4J_PASSWORD');
    if (!password) {
      throw new Error('NEO4J_PASSWORD is not defined');
    }

    const database = this.configService.get<string>('NEO4J_DATABASE');
    if (!database) {
      throw new Error('NEO4J_DATABASE is not defined');
    }

    const config: Neo4jConfig = { scheme, host, port, username, password, database };

    // Stocker le nom de la base pour l'utiliser lors de la création de la session
    this.database = config.database;

    // Créer le driver sans inclure la propriété 'database' dans les options
    this.driver = neo4j.driver(
      `${config.scheme}://${config.host}:${config.port}`,
      neo4j.auth.basic(config.username, config.password),
      {} // options du driver (vide ici)
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.driver.close();
  }

  getSession(): Session {
    // Préciser le nom de la base à utiliser lors de la création de la session
    return this.driver.session({ database: this.database });
  }

  async executeQuery(
    query: string,
    params: Record<string, any> = {},
  ): Promise<QueryResult> {
    const session = this.getSession();
    try {
      return await session.executeWrite(tx => tx.run(query, params));
    } finally {
      await session.close();
    }
  }

  async createNode(
    label: string,
    properties: NodeProperties,
  ): Promise<QueryResult> {
    const query = `
      CREATE (n:${label} $properties)
      RETURN n
    `;
    return this.executeQuery(query, { properties });
  }

  async findNodesByLabel(label: string): Promise<QueryResult> {
    const query = `
      MATCH (n:${label})
      RETURN n
    `;
    return this.executeQuery(query);
  }
}
