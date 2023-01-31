import {Args, Runner} from './cli'
import {createNetworkProvider} from '../network/createNetworkProvider'
import {findScripts, selectFile} from '../utils'
import {InquirerUIProvider} from '../ui/InquirerUIProvider'

export const run: Runner = async (args: Args) => {
    require('ts-node/register')

    const {module: mod} = await selectFile(findScripts, {
        ui: new InquirerUIProvider(),
        hint: args._.length > 1 && args._[1].length > 0 ? args._[1] : undefined,
    })

    if (typeof mod.run !== 'function') {
        throw new Error('Function `run` is missing!')
    }

    const networkProvider = await createNetworkProvider()

    await mod.run(networkProvider, args._.slice(2))
}
