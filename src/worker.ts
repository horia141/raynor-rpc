import { Constructor, Marshaller } from 'raynor'

import { ServiceDescriptor, MethodDescriptor, OutputDescriptor } from './core'

export interface InputData {
    params: any[];
}

export enum OutputStatus {
    OK = 0,
    ERROR = 1
}

export interface OutputData {
    status: OutputStatus;
    data: any|null;
    error: any|null;
}


export type InMemoryHandler = (inputData: InputData) => Promise<OutputData>;


export class InMemoryServer {
    private readonly _handlers: Map<string, InMemoryHandler>;

    public constructor() {
        this._handlers = new Map<string, InMemoryHandler>();
    }

    public registerHandler(methodName: string, handler: InMemoryHandler): void {
        if (this._handlers.has(methodName)) {
            throw new Error('Bad thing');
        }

        this._handlers.set(methodName, handler);
    }

    public async handle(methodName: string, inputData: InputData): Promise<OutputData> {
        if (!this._handlers.has(methodName)) {
            throw new Error('Bad thing');
        }

        return await (this._handlers.get(methodName) as InMemoryHandler)(inputData);
    }
}


export function newInMemoryServer<T>(serviceClass: Constructor<T>, service: T): InMemoryServer {
    const inMemoryServer = new InMemoryServer();

    const serviceDescriptor = serviceClass.prototype.__service as ServiceDescriptor;

    for (const [methodName, methodDescriptor] of serviceDescriptor.methods.entries()) {
        inMemoryServer.registerHandler(methodName, async (inputData: InputData): Promise<OutputData> => {
            // TODO: check params here.
            const params: any[] = [];

            try {
                for (const [idx, paramDescriptor] of methodDescriptor.params.entries()) {
                    const param = paramDescriptor.marshaller.extract(inputData.params[idx]);
                    params.push(param);
                }
            } catch (e) {
                // TODO: handle Ryanor error here
            }

            try {
                const result = await ((service as any)[methodName] as any).apply(service, params);
                const outputData = {
                    status: OutputStatus.OK,
                    data: (((methodDescriptor as MethodDescriptor<any>).output as OutputDescriptor<any>).marshaller as Marshaller<any>).pack(result),
                    error: null
                };
                return outputData;
            } catch (e) {
                // TODO: test if it's one of the allowed errors
                const outputData = {
                    status: OutputStatus.ERROR,
                    data: null,
                    error: 'foo'
                };
                return outputData;
            }
        });
    }

    return inMemoryServer;
}

export function newInMemoryClient<T>(serviceClass: Constructor<T>, inMemoryServer: InMemoryServer): T {
    const theT = new serviceClass();
    const serviceDescriptor = serviceClass.prototype.__service as ServiceDescriptor;

    for (const [methodName, methodDescriptor] of serviceDescriptor.methods.entries()) {
        (theT as any)[methodName] = async(...params: any[]) => {
            const marshalledParams: any[] = [];
            for (const [idx, paramDescriptor] of methodDescriptor.params.entries()) {
                // TODO: error correction here. Should have the same number of params!
                // TODO: take into consideration required params as well!
                const param = params[idx];
                try {
                    const marshalledParam = paramDescriptor.marshaller.pack(param);
                    marshalledParams.push(marshalledParam);
                } catch (e) {
                    // TODO: handle Raynor error here
                }
            }

            const inputData = {
                params: marshalledParams
            };

            const outputData = await inMemoryServer.handle(methodName, inputData);

            if (outputData.status != OutputStatus.OK) {
                throw new Error('Uh-oh');
            }

            try {
                return (methodDescriptor.output as any).marshaller.extract(outputData.data);
            } catch (e) {
                console.log(e);
                // TODO: handle Raynor error here
            }
        }
    }

    return theT;
}

// export interface HttpClientServerParams {
//     protocol: string;
//     host: string;
//     basePath: string;
// }

// export function newHttpClient<T>(serviceClass: Constructor<T>, serverParams: HttpClientServerParams): T {
//     const theT = new serviceClass();
//     const serviceDescriptor = serviceClass.prototype.__service as ServiceDescriptor;

//     for (const [methodName, methodDescriptor] of serviceDescriptor.methods.entries()) {
//         // TODO: How can we make methods only return properties of T?
//         (theT as any)[methodName] = async (...params: any[]) => {
//             const methodUrl = `${serverParams.protocol}://${serverParams.host}${serverParams.basePath}/${methodName}`;
//             console.log(methodUrl);

//             const marshalledParams: any[] = [];
//             for (const [idx, paramDescriptor] of methodDescriptor.params.entries()) {
//                 // TODO: error correction here. Should have the same number of params!
//                 // TODO: take into consideration required params as well!
//                 const param = params[idx];
//                 try {
//                     const marshalledParam = paramDescriptor.marshaller.pack(param);
//                     marshalledParams.push(marshalledParam);
//                 } catch (e) {
//                     // TODO: handle Raynor error here
//                 }
//             }

//             const data = JSON.stringify({
//                 params: marshalledParams
//             });

//             // TODO: does not work in browser! Fix this via fetch
//             // const req = http.request(options, (res) => {

//             // })

//             console.log(data);
//         }
//     }

//     return theT;
// }
