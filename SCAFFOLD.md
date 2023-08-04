# Building a dapp from wrappers

How should the project be organized to ensure that the `blueprint
scaffold` creates a dapp successfully?

### 1. The base

All wrappers must lie strictly in the `wrappers/` directory and imports in
them **cannot go to the root** of the project or higher.

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

-   The wrapper must contain a `createFromAddress` method, like this:

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

### 2. sendFunctions

In tests, _sendFunctions_ are often used with _treasuries_, to send some
info to a contract or start a chain of transactions. Here, in dapp,
the connected wallet will act like treasury, to execute send.

To be avaliable in the dapp, each sendFunction (here `sendMint`) must
start with `send`, must receive `provider` of type `ContractProvider` and
`via` of `Sender` in its parameters.

##### Example:

```typescript
async sendMint(
    provider: ContractProvider,
    via: Sender,
    to: Address,
    jetton_amount: bigint,
    forward_ton_amount: bigint,
    total_ton_amount: bigint
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
`components/Fields/`, you can take any type as a reference.

### 3. getFunctions

The same as sendFunctions, but they don't need `via` argument because they
are not sending anything to the contract.

##### Example:

```typescript
async getWalletAddress(provider: ContractProvider, owner: Address): Promise<Address> {
    const res = await provider.get('get_wallet_address', [
        { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
    ]);
    return res.stack.readAddress();
}
```

The result of a get method will be printed just like from `console.log()`,
except some native TOn types: Cell, Slice, Builder will be printed as hex
and Address will be in the user-friendly format.

### 4. createFromConfig (optional)

If we want our contract to have _Deploy_ option in the ui, its wrapper
must contain `createFromConfig` method, which takes argument `config` of
type named after main class, e.g. `JettonMinterConfig`. This type must be
defined in wrapper too.

##### Result example:

```typescript
export type JettonMinterConfig = {
    admin: Address;
    content: Cell;
    voting_code: Cell;
    testValue?: boolean;
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
        forward_ton_amount: bigint,
        total_ton_amount: bigint
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

## Configuration

After running `blueprint scaffold`, you will have a config file in
`dapp/public/config.json`.
