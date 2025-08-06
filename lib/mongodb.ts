import { MongoClient, Db, Collection } from 'mongodb'

let clientPromise: Promise<MongoClient> | null = null

// Lazy initialization of MongoDB connection
function getClientPromise(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
  }

  if (!clientPromise) {
    const uri = process.env.MONGODB_URI
    const options = {}

    if (process.env.NODE_ENV === 'development') {
      // In development mode, use a global variable so that the value
      // is preserved across module reloads caused by HMR (Hot Module Replacement).
      let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>
      }

      if (!globalWithMongo._mongoClientPromise) {
        const client = new MongoClient(uri, options)
        globalWithMongo._mongoClientPromise = client.connect()
      }
      clientPromise = globalWithMongo._mongoClientPromise
    } else {
      // In production mode, it's best to not use a global variable.
      const client = new MongoClient(uri, options)
      clientPromise = client.connect()
    }
  }

  return clientPromise
}

// Export a function to get the MongoDB client promise
export default function getMongoClientPromise(): Promise<MongoClient> {
  return getClientPromise()
}

// Helper function to get database
export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise()
  return client.db('gads-api') // You can change this database name if needed
}

// Helper function to get templates collection
export async function getTemplatesCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection('campaign-templates')
}

// Helper function to get dummy campaign tracking collection
export async function getDummyCampaignTrackingCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection('dummy-campaign-tracking')
}