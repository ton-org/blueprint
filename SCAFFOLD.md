# Dapp from wrappers - `blueprint scaffold`

[Try the demo here](https://1ixi1.github.io/blueproject/)

<img width="80%" src="https://github.com/1IxI1/blueprint/assets/53380262/c4545d91-c659-414f-9bcc-8bc5d303aea6"/>


How should the project be organized to ensure that the `blueprint
scaffold` creates a dapp properly?

- [Structure](#structure)
- [Project name](#project-name)
- [Wrapper requirements](#wrapper-requirements)
  - [sendFunctions](#sendfunctions)
  - [getFunctions](#getfunctions)
  - [createFromConfig (optional)](#createfromconfig-(optional))
- [Scaffold it](#scaffold-it)
- [Configuration](#configuration)
  - [Tab Names](#tab-names)
  - [Field Titles](#field-titles)
  - [Out Names (in get methods)](#out-names-in-get-methods)
  - [Override](#override)
- [Passing URL parameters](#passing-url-parameters)
  - [Via arguments](#via-arguments)
  - [Via paths](#via-paths)
  - [Addresses for individual wrappers](#addresses-for-individual-wrappers)
  - [Default values for fields](#default-values-for-fields)
- [Example config](##example-of-edited-config.json)

## Structure

First, wrappers in your project must lie strictly in the `wrappers/`
directory and imports in them **cannot go to the root** of the project or
higher.

❌ Not like this:

```
contracts/
 └── my-contract.fc
SendModes.ts <╗                    // will not be included in dapp
Errors.ts <═══╬═══════════════╗    // will not be included in dapp
Ops.ts <══════╝               ║    // will not be included in dapp
wrappers/                     ║
 ├── MyContract.compile.ts    ║
 └── MyContract.ts ═══════════╣
tests/                        ║
 └── MyContract.spec.ts ══════╝
```

✅ But like this:

```
contracts/
 └── my-contract.fc
wrappers/
 ├── SendModes.ts <╗
 ├── Errors.ts <═══╬══════════╗
 ├── Ops.ts <══════╝          ║
 ├── MyContract.compile.ts    ║
 └── MyContract.ts ═══════════╣
tests/                        ║
 └── MyContract.spec.ts ══════╝
```

## Project name

The dapp title will be generated from package.json. Scaffold script
expects the `name` field to have a value of _kebab-case_.

```json
{
    "name": "jetton-dao",
    "version": "0.0.1",
    "license": "MIT",
    ...
```

The title will be **Jetton Dao**

Dapp title is written in dapp/.env file and you may edit it easily. It
won't be overwritten by `blueprint scaffold --update`.

## Wrapper requirements

Let's say the contract we created is called `jetton-minter`.

If we want its interface to be included in dapp, it must meet the
following requirements:

-   Its wrapper must be `wrappers/JettonMinter.ts`.
-   The wrapper must contain a class, which implements `Contract`
    interface and named like the filename body (`JettonMinter`):

```typescript
export class JettonMinter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
    ...
}
```

-   The wrapper must contain a `createFromAddress` method:

```typescript
export class JettonMinter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonMinter(address);
    }
    ...
}
```

-   And our wrapper must have at least a sendFunction or a getFunction, in
    the format described below.

### sendFunctions

In tests, _sendFunctions_ are often used with _treasuries_, to send some
info to a contract or start a chain of transactions. Here, in dapp,
the connected wallet will act like treasury, to execute send.

To be avaliable in dapp, each sendFunction (here `sendMint`) must
start with `send`, must receive `provider` of type `ContractProvider` and
`via` of `Sender` in its parameters.

##### Example:

```typescript
async sendMint(
    provider: ContractProvider,
    via: Sender,
    to: Address,
    jetton_amount: bigint,
    forward_ton_amount: bigint = toNano('0.05'),
    total_ton_amount: bigint = toNano('0.1')
) {
    await provider.internal(via, {
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: JettonMinter.mintMessage(to, jetton_amount, forward_ton_amount, total_ton_amount),
        value: total_ton_amount + toNano('0.1'),
    });
}
```

##### Available argument types

-   `Address` in Address
-   `bigint`, `number` in Amount
-   `boolean` in Bool
-   `Buffer` in Buffer
-   `Cell` in Cell
-   `null` in Null
-   `string` in String
-   MultiType for splitted types, gives a list to choose.
-   Unknown for others, just a placeholder. If the parameter is optional,
    will pass `undefined` to a function, otherwise the function won't run.

You can implement other types for your specific proposes in
`components/Fields/`, take any type as a reference.

### getFunctions

The same as sendFunctions, but they don't need `via` argument because they
are not sending anything to the contract.

##### Example:

```typescript
async getWalletAddress(provider: ContractProvider, owner: Address) {
    const res = await provider.get('get_wallet_address', [
        { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
    ]);
    return res.stack.readAddress();
}
```

The result of a get method will be printed just like from `console.log()`,
except some native TON types: Cell, Slice, Builder will be printed as hex
and Address will be in the user-friendly format.

### createFromConfig (optional)

If we want our contract to have _Deploy_ option in the ui, its wrapper
must contain `createFromConfig` method, which takes argument `config` of
type named after main class + `Config`, e.g. `JettonMinterConfig`. This
type must be defined in the wrapper too.

##### Result example:

```typescript
export type JettonMinterConfig = {
    admin: Address;
    content: Cell;
    voting_code: Cell;
};

export function jettonMinterConfigToCell(config: JettonMinterConfig): Cell {
    return beginCell()
        .storeCoins(0)
        .storeAddress(config.admin)
        .storeRef(config.content)
        .storeUint(0, 64)
        .storeRef(config.voting_code)
        .endCell();
}

export class JettonMinter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonMinter(address);
    }

    static createFromConfig(config: JettonMinterConfig, code: Cell, workchain = 0) {
        const data = jettonMinterConfigToCell(config);
        const init = { code, data };
        return new JettonMinter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    static mintMessage(to: Address, jetton_amount: bigint, forward_ton_amount: bigint, total_ton_amount: bigint) {
        return beginCell()
            .storeUint(Op.minter.mint, 32)
            .storeUint(0, 64) // op, queryId
            .storeAddress(to)
            .storeCoins(jetton_amount)
            .storeCoins(forward_ton_amount)
            .storeCoins(total_ton_amount)
            .endCell();
    }
    async sendMint(
        provider: ContractProvider,
        via: Sender,
        to: Address,
        jetton_amount: bigint,
        forward_ton_amount: bigint = toNano('0.05'),
        total_ton_amount: bigint = toNano('0.1')
    ) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonMinter.mintMessage(to, jetton_amount, forward_ton_amount, total_ton_amount),
            value: total_ton_amount + toNano('0.1'),
        });
    }

    async getWalletAddress(provider: ContractProvider, owner: Address): Promise<Address> {
        const res = await provider.get('get_wallet_address', [
            { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
        ]);
        return res.stack.readAddress();
    }
}
```

## Scaffold it

That's it, now you can run this command in the root of your project to
generate a dapp for your contracts:

```bash
yarn blueprint scaffold
```

To try the app, run this:

```bash
cd dapp && yarn && yarn start
```

Or, if you have changed your wrappers only a bit, you can just renew the
wrappers and the config, instead of copying the whole react app from
templates.

```bash
yarn blueprint scaffold --update
```

> Your dapp config won't be overwritten by `--update`. \
> Only extended, if script found some new parameters, methods or wrappers.\
> Read more on config in the next section.

## Configuration

Scaffold generates 2 json files for your project that can (or should) be
customized:
[dapp/public/wrappers.json](https://github.com/1IxI1/blueproject/blob/main/dapp/public/wrappers.json)
and
[dapp/public/config.json](https://github.com/1IxI1/blueproject/blob/main/dapp/public/config.json).
In the first one, you can simply delete some methods or wrappers and
optionally set default values (be careful with this).

In the second one, things are much more interesting, here is an example of
config.json for our `JettonMinter`:

```json
{
  "JettonMinter": {
    "defaultAddress": "",
    "tabName": "",
    "sendFunctions": {
      "sendDeploy": {
        "tabName": "",
        "params": {
          "value": {
            "fieldTitle": ""
          }
        }
      },
      "sendMint": {
        "tabName": "",
        "params": {
          "to": {
            "fieldTitle": ""
          },
          "jetton_amount": {
            "fieldTitle": ""
          },
          "forward_ton_amount": {
            "fieldTitle": "",
            "overrideWithDefault": false
          },
          "total_ton_amount": {
            "fieldTitle": "",
            "overrideWithDefault": false
          }
        }
      }
    },
    "getFunctions": {
      "getWalletAddress": {
        "tabName": "",
        "params": {
          "owner": {
            "fieldTitle": ""
          }
        },
        "outNames": []
      }
    }
  }
}
```

### Without configuration:
<img width="75%" src="https://github.com/1IxI1/blueprint/assets/53380262/77eb1686-bb5a-4375-b473-1a7a2d7760a2"/>


##### Default Address

If you set `defaultAddress`, the address input field and the _Deploy_
button will disappear from the ui. It will be impossible to replace the
address specified in the config for the wrapper with the address in the
url. More on url parameters [here]().


##### Tab Names

The `tabName` parameter is just an alias for a wrapper or method in the
ui.


##### Field Titles

Almost like `tabName`, `fieldTitle` is an alias to a parameter in the
input card.


##### Out Names (in get methods)

In `outNames` you can specify the names of the variables that the get function
returns. They will be read in order for each value in the resulting
Object. If there are not enough names from `outNames`, the names of the
keys in the received object will be output.

##### Override

By setting `"overrideWithDefault": "true"` you will make the field
inaccessible to the user for input, and instead `defaultValue` or
`undefined` will be passed to the parameter.


## Passing URL parameters

After your dapp was deployed, you can specify the wrapper, method, and contract address in the url using
parameters or paths.

#### Via arguments

```
https://my-dapp.xyz/?wrapper=<WrapperName>
https://my-dapp.xyz/?wrapper=<WrapperName>&method=<methodName>
https://my-dapp.xyz/?wrapper=<WrapperName>&method=<methodName>&address=<EQAddr>
```

Use only `JettonMinter` wrapper, and deny select (hide tabs): \
https://1ixi1.github.io/blueproject/?wrapper=JettonMinter

Use only `sendDiscovery` method: \
https://1ixi1.github.io/blueproject/?wrapper=JettonMinter&method=sendDiscovery

Also works with get methods: \
https://1ixi1.github.io/blueproject/?wrapper=JettonMinter&method=getJettonData

Specify an address (won't work if already has an address in config.json): \
https://1ixi1.github.io/blueproject?wrapper=JettonWallet&method=getJettonData&address=EQCVervJ0JDFlSdOsPos17zHdRBU-kHHl09iXOmRIW-5lwXW

The parameters passed this way should go exactly in the sequence: _wrapper, method, address_.

#### Via paths

You may use paths instead of args, for shorter URLs

```
https://my-dapp.xyz/<WrapperName>
https://my-dapp.xyz/<WrapperName>/<methodName>
https://my-dapp.xyz/<WrapperName>/<methodName>/<EQAddr>
```

> Paths variant won't work with github pages
> ([reason](https://create-react-app.dev/docs/deployment/#notes-on-client-side-routing)),
> but may be used in production, or during development, on localhost:
> http://localhost:3000/blueproject/JettonWallet/getJettonData/EQCVervJ0JDFlSdOsPos17zHdRBU-kHHl09iXOmRIW-5lwXW

**Example (doesn't work):** \
https://1ixi1.github.io/blueproject/JettonWallet/getJettonData/EQCVervJ0JDFlSdOsPos17zHdRBU-kHHl09iXOmRIW-5lwXW


#### Addresses for individual wrappers

You can specify several addresses for wrappers at once, without specifying one and leaving
the choice of the desired method and wrapper to the user.

```
https://my-dapp.xyz/?<WrapperName1>=<EQAddr1>&<WrapperNameN>=<EQAddrN>
```

**Example (works):** \
https://1ixi1.github.io/blueproject/?JettonMinter=EQBjEw-SOe8yV2kIbGVZGrsPpLTaaoAOE87CGXI2ca4XdzXA&JettonWallet=EQCVervJ0JDFlSdOsPos17zHdRBU-kHHl09iXOmRIW-5lwXW


#### Default values for fields

You can also set default values for parameter fields. The specified
parameter will act as the `defaultValue` in wrappers.json (only if
defaultValue was not specified in the file yet). You can combine this with
or without specifying the exact method, then it will be used where there
is a parameter with that name.

```
https://my-dapp.xyz/?<param1>=<value1>&<param2>=<value2>
```

**Example with exact method:** (<a href="https://1ixi1.github.io/blueproject/?wrapper=JettonMinter&method=sendCreateSimpleMsgVoting&expiration_date=11111111111&minimal_execution_amount=toNano(%270.5%27)&payload=Cell.fromBase64(%27te6cckEBAQEACAAADDAuanNvbuTiyMU=%27)&value=toNano(%27111%27))">link</a>):
```
https://1ixi1.github.io/blueproject/?
    wrapper=JettonMinter&
    method=sendCreateSimpleMsgVoting&
    expiration_date=11111111111&
    minimal_execution_amount=toNano('0.5')&
    payload=Cell.fromBase64(''te6cckEBAQEACAAADDAuanNvbuTiyMU=')&
    value=toNano('111')
```

**Example with parameters for all methods** (<a href="https://1ixi1.github.io/blueproject/?wrapper=JettonMinter&method=sendCreateSimpleMsgVoting&expiration_date=11111111111&minimal_execution_amount=toNano(%270.5%27)&payload=Cell.fromBase64(%27te6cckEBAQEACAAADDAuanNvbuTiyMU=%27)&value=toNano(%27111%27))">link</a>):
```
https://1ixi1.github.io/blueproject/?
    expiration_date=11111111111&
    minimal_execution_amount=toNano('0.5')&
    payload=Cell.fromBase64(''te6cckEBAQEACAAADDAuanNvbuTiyMU=')&
    value=toNano('111')
```


## Example of edited config.json

```json
{
  "JettonMinter": {
    "defaultAddress": "",
    "tabName": "Minter",
    "sendFunctions": {
      "sendDeploy": {
        "tabName": "",
        "params": {
          "value": {
            "fieldTitle": "TONs"
          }
        }
      },
      "sendMint": {
        "tabName": "Mint",
        "params": {
          "to": {
            "fieldTitle": "Receiver"
          },
          "jetton_amount": {
            "fieldTitle": "To mint"
          },
          "forward_ton_amount": {
            "fieldTitle": "",
            "overrideWithDefault": true
          },
          "total_ton_amount": {
            "fieldTitle": "TONs",
            "overrideWithDefault": false
          }
        }
      }
    },
    "getFunctions": {
      "getWalletAddress": {
        "tabName": "Wallet from address",
        "params": {
          "owner": {
            "fieldTitle": "Owner"
          }
        },
        "outNames": ["JWallet Address"]
      }
    }
  }
}
```
<img width="75%" src="https://github.com/1IxI1/blueprint/assets/53380262/48292622-e901-489e-b090-883fd2e49e21"/>
<img width="75%" src="https://github.com/1IxI1/blueprint/assets/53380262/659658ae-ae62-4e03-aaf9-103ddce3f947"/>
