import { MarshalWith, MarshallerConstructor } from 'raynor'
import * as r from 'raynor'

// We want some things.

// A single point-of-truth class/object which depends on a bunch of entities annotated with Raynor
// Ultimately this can be just a JSON. But it's a bad way to specify things, so something looking
// like a class would be the best.

function Rpc() {
    return function(target: any, methodName: string) {
        if (!(target.hasOwnProperty('__schema'))) {
            target.__schema = {
                'rpcs': {}
            };
        }

        if (!(methodName in target.__schema['rpcs'])) {
            target.__schema['rpcs'][methodName] = {
                input: [],
                output: {}
            };
        }
    }
}

function RpcParam<T>(marshallerCtor: MarshallerConstructor<T>) {
    return function(target: any, methodName: string | symbol, parameterIndex: number) {
        if (!(target.hasOwnProperty('__schema'))) {
            target.__schema = {
                'rpcs': {}
            };
        }

        if (!(methodName in target.__schema['rpcs'])) {
            target.__schema['rpcs'][methodName] = {
                input: [],
                output: {}
            };
        }

        target.__schema['rpcs'][methodName].input[parameterIndex] = {
            ctor: marshallerCtor,
            required: true
        };
    }
}

export class Book {
    @MarshalWith(r.IdMarshaller)
    id: number = 0;
    @MarshalWith(r.StringMarshaller)
    title: string = '';
}

async function nop<T>(..._args: any[]): Promise<T> {
    throw new Error('Cannot invoke this function directly');
}

export class LibraryService {
    @Rpc()
    async getBooks(): Promise<Book[]> {
        return nop<Book[]>();
    }

    @Rpc()
    async updateBook(
        @RpcParam(r.IdMarshaller) bookId: number,
        @RpcParam(r.StringMarshaller) newTitle: string): Promise<Book> {
        return nop<Book>(bookId, newTitle);
    }
}

export class LibraryServiceServer extends LibraryService {
    async getBooks(): Promise<Book[]> {
        return [];
    }

    async updateBook(_bookId: number, _newTitle: string): Promise<Book> {
        return new Book();
    }
}

const ll = new LibraryServiceServer();
console.log((ll as any).__schema);
ll.getBooks().then(l => console.log(JSON.stringify(l)));

// A way to build a client object from the point-of-truth class/object. This has a bunch of async
// methods for each one defined there, and allows "almost-local" behaviour. It should be modulated
// by a transport object - a Http/Https type thing. But with other possibilities as well.

// A way to build a server object from the point-of-truth class/object. It should be modulated
// by a transport object - a Http/Https type thing. Possibly Express based.

// TODO: server creation needs to take care that all @Rpc methods are overriden.
