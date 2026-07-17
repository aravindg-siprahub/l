import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import inspect
engine = create_async_engine('postgresql+asyncpg://postgres:%40Lorvish1516@db.kelkrhvmtqeovhtnytoh.supabase.co:5432/postgres')
async def check():
    async with engine.connect() as conn:
        tables = await conn.run_sync(lambda sync_conn: inspect(sync_conn).get_table_names())
        print('Tables:', tables)
    await engine.dispose()
asyncio.run(check())
