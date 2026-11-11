// Local MCP bridge to the user's Qassa installation. Project data stays in Nabd.
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const installation = process.env.NABD_EDIT_TOOL ?? 'D:/AntigravityProjects/Edit-tool'
const sdk = path.join(installation, 'node_modules/@modelcontextprotocol/sdk/dist/esm/client')
const { Client } = await import(pathToFileURL(path.join(sdk, 'index.js')).href)
const { StdioClientTransport } = await import(pathToFileURL(path.join(sdk, 'stdio.js')).href)
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(installation, 'node_modules/tsx/dist/cli.mjs'), path.join(installation, 'packages/mcp/src/index.ts')],
  cwd: installation,
  env: { ...process.env, EDIT_PORT: '14317', EDIT_DATA_DIR: path.join(workspace, 'studio/edit-data'), EDIT_UI_URL: 'http://127.0.0.1:14317' },
  stderr: 'inherit',
})
const client = new Client({ name: 'nabd-motion-studio', version: '1.0.0' })
try {
  await client.connect(transport)
  const name = process.argv[2] ?? 'projects_list'
  if (name === 'list') {
    const result = await client.listTools()
    console.log(JSON.stringify(result.tools.map(({name, inputSchema}) => ({name, inputSchema})), null, 2))
  } else {
    const input = process.argv[3] ?? '{}'
    const args = JSON.parse(input.startsWith('@') ? await readFile(path.resolve(input.slice(1)), 'utf8') : input)
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 120000 })
    for (const block of result.content ?? []) {
      if (block.type === 'text') console.log(block.text)
      if (block.type === 'image') {
        const folder = path.join(workspace, 'docs/motion')
        await mkdir(folder, { recursive: true })
        const tag = process.argv[4] ?? args.data?.style
        const suffix = tag ? `-${String(tag).replace(/[^a-z0-9-]/gi, '')}` : ''
        const file = path.join(folder, `${name}-${args.project ?? 'sample'}${suffix}.jpg`)
        await writeFile(file, Buffer.from(block.data, 'base64'))
        console.log(`Image: ${file}`)
      }
    }
    if (result.isError) process.exitCode = 1
  }
} finally {
  await client.close()
}
