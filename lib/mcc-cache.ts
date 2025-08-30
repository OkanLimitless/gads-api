import getMongoClientPromise, { getDatabase } from './mongodb'

export type CachedAccount = {
	mccId: string
	accountId: string
	name: string
	currency: string
	timeZone: string
	status: string
	testAccount: boolean
	level: number
	isSuspended: boolean
	last30DaysCost?: number
	yesterdayCost?: number
	todayCost?: number
	detectedAt?: string
	detectionReason?: string
}

export type CacheMeta = {
	mccId: string
	type: 'suspended' | 'eligible_zero_campaigns' | 'spend_summary'
	status: 'idle' | 'running' | 'error' | 'complete'
	startedAt?: string
	completedAt?: string
	error?: string
	counts?: Record<string, number>
}

export async function getCollections() {
	const db = await getDatabase()
	const accounts = db.collection<CachedAccount>('mcc_cached_accounts')
	const meta = db.collection<CacheMeta>('mcc_cache_meta')
	await accounts.createIndex({ mccId: 1, accountId: 1 }, { unique: true })
	await accounts.createIndex({ mccId: 1, isSuspended: 1 })
	await accounts.createIndex({ mccId: 1, status: 1 })
	await meta.createIndex({ mccId: 1, type: 1 }, { unique: true })
	return { accounts, meta }
}

export async function upsertAccounts(mccId: string, rows: CachedAccount[]) {
	const { accounts } = await getCollections()
	if (!rows || rows.length === 0) return
	const ops = rows.map(r => ({
		updateOne: {
			filter: { mccId, accountId: r.accountId },
			update: { $set: { ...r, mccId } },
			upsert: true,
		},
	}))
	await accounts.bulkWrite(ops, { ordered: false })
}

export async function setMeta(mccId: string, type: CacheMeta['type'], meta: Partial<CacheMeta>) {
	const { meta: metaCol } = await getCollections()
	await metaCol.updateOne(
		{ mccId, type },
		{ $set: { mccId, type, ...meta } },
		{ upsert: true }
	)
}

export async function getMeta(mccId: string, type: CacheMeta['type']) {
	const { meta } = await getCollections()
	return meta.findOne({ mccId, type })
}

export async function getSuspendedFromCache(mccId: string) {
	const { accounts } = await getCollections()
	const rows = await accounts.find({ mccId, isSuspended: true }).toArray()
	return rows
}

export async function getAllFromCache(mccId: string) {
	const { accounts } = await getCollections()
	return accounts.find({ mccId }).toArray()
}