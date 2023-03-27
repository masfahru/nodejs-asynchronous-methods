import EventEmitter from 'events'
import fastq from 'fastq'
import needle from 'needle'
import process from 'process'

const getData = async (message: string) => {
  const messageInts = message.match(/[0-9]+/)
  const messageInt =
    messageInts && messageInts.length ? Number(messageInts[0]) + 1 : 1
  const label = `Task ${message} is done`
  console.time(label)
  await needle(
    'get',
    `https://jsonplaceholder.typicode.com/todos/${messageInt}`,
    { json: true }
  ).then(() => console.timeEnd(label))
}

const queueList = fastq.promise(getData, 5)

const emitter = new EventEmitter()
emitter.on('print', getData)

const taskRunner = async (message: string) => {
  const label = `Response time for ${message}`
  console.time(label)
  if (message.includes('event')) {
    emitter.emit('print', message)
  } else if (message.includes('queue')) {
    queueList.push(message).catch((err) => console.log(err))
  } else if (message.includes('await')) {
    await getData(message)
  } else {
    getData(message).catch((error) => console.log(error))
  }
  console.timeEnd(label)
}

for (let index = 0; index < 5; ) {
  taskRunner(`normal-${index}`)
  taskRunner(`event-${index}`)
  taskRunner(`queue-${index}`)
  taskRunner(`await-${index}`)
  index += 1
}

setInterval(() => {
  // @ts-ignore
  const activeResources: string[] = process.getActiveResourcesInfo()
  if (!activeResources.includes('TCPSocketWrap')) {
    process.exit()
  }
}, 1000)
