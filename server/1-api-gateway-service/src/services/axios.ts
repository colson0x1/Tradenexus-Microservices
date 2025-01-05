/* @ Axios Service for Microservices */
// Here, im going to append the `GATEWAY_JWT_TOKEN` and then also set the
// headers that I want my request to have
import axios from 'axios';
import { sign } from 'jsonwebtoken';
import { config } from '@gateway/config';

// Im not going to create an instance here. Instead, I'll create an instance
// of the class where I need it. The reason is because, the class constructor
// will require some properties
// In other class like inside auth-middleware.ts, I've created the instance
// in the class and exported it because those class constructor does not
// require any property i.e does not require any param i.e defining constructor
// without any property, an empty constructor. So, because I don't really
// require any additional property. That is why I exported instance inside those
// same classes.
// But now with respect to the Axios Class that I want to create here, Im not
// going to export an instance inside of this file. Instead, Im going to export
// the whole class because when I create an instance of this class, I would
// need to pass in some properties.
export class AxiosService {
  // Setting `axios` property to public because I want to be able to access
  // this from outside of this class.
  // So here, we're getting our type from `axios.create` i.e in TypeScript,
  // if we want to get the type of a particular property (i.e `axios.create` method)
  // that will be set to another property (i.e `axios` property), we can do
  // it this way. So whatever type is set on the `.create` method, that is
  // whats going to be the type for this `axios` property.
  // So now `axios` property is of type AxiosInstance.
  public axios: ReturnType<typeof axios.create>;

  // This constructor will take in two properties.
  // The first property is the baseURL because im going to create multiple
  // services like authentication service, user service. So im going to pass
  // in the baseURL of each service anytime I create an instance of this
  // AxiosService class.
  // And the second is going to be the service name. This service name is what
  // im going to add in jwt token. i.e one of the token that is in the shared
  // library's token property like: ['auth', 'search', 'message', 'order']
  // All those properties there inside token array represents the name of the
  // service. Its better to use some kind of alpha numeric keys instead of
  // plain text like 'auth'.
  // So Im going to use JWT token to sign and later when i got to
  // verifyGatewayRequest part, im going to check if it contains the
  // gatewayToken property and then, if gatewayToken property contains an id
  // which is contained in that token i.e ['auth', 'message']
  constructor(baseUrl: string, serviceName: string) {
    this.axios = this.axiosCreateInstance(baseUrl, serviceName);
  }

  // Method that will set up Axios
  // This method is going to return a type of AxiosInstance
  public axiosCreateInstance(baseUrl: string, serviceName?: string): ReturnType<typeof axios.create> {
    // Need to set `gatewayToken` which is required if the request is coming
    // from the API gateway. So in microservices that connects to the API
    // gateway via the Request Response HTTP, then Im going to check if it
    // contains this `gatewayToken` property as specified on shared library
    // gateway-middleware.ts.
    let requestGatewayToken = '';
    if (serviceName) {
      // Since serviceName is optional. So if the serviceName exists, then
      // I want to sign this gatewayToken. And the property that i want to pass
      // in is an object that will contain an `id`. And signin with `GATEWAY_JWT_TOKEN`
      // @ Sign the token
      // So if the request is going to the authentication service, then whatever
      // the service name i use, im going to set it to this `id` property and
      // then sign it, add it to the request.
      requestGatewayToken = sign({ id: serviceName }, `${config.GATEWAY_JWT_TOKEN}`);
    }
    // @ Add it to the request
    const instance: ReturnType<typeof axios.create> = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Need to set this `gatewayToken` because in the shared library, in
        // the verifyGatewayRequest, im checking if this gatewayToken exists
        // inside of headers
        // i.e if (!req.headers?.gatewayToken) {}
        // So, need to set here.
        gatewayToken: requestGatewayToken
      },
      // withCredentials is very important so that the token will be added
      // to the request. Because we're saving it on the cookie session, so
      // we need to send, set withCredentials to true
      withCredentials: true
    });

    return instance;
  }
}

/* @ Implementation Example */
// On second argument to AxiosService, whatever value we put right here, that
// is what the verifyGatewayRequest method from the gateway-middleware whos
// implementation is inside shared library, will check for.
// For example, if we set to 'auths', and then we make the request, and then
// the verifyGatewayRequest checks that 'auths' does not exist in the list of
// tokens. So its going to throw an error i.e its going to reject the request.
// So the request will be rejected. We'll just assume that the request is not
// coming from the API gateway.
// But if we set it to 'auth', and then it checks inside the gateway-middleware,
// verify the token and it has this `id` payload and it checks. And it exists
// inside the token list. Then we assume the request is coming from the API
// gateway. It'll allow the request to proceed.
// Thus, as archited, this will allow requests to come via only the API gateway
// and not from outside. So if we try to access the auth service from outside
// or from any other part of the application that is not the API gateway, its
// always going to reject the request.
/* const axiosTest = new AxiosService(`${config.AUTH_BASE_URL}/api/v1/auth`, 'auth') */
