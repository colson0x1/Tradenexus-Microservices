import axios from 'axios';
import { AxiosService } from '@gateway/services/axios';
import { config } from '@gateway/config';

// NOTE: Im not going to use the same axios instance for all the services. So
// each servive will have its own Axios Instance. The reasons for it is, we need
// to add the JWT token coming from the client that is added to the cookie
// session. So we need to append it to the request that is going from the API
// gateway to the microservices i.e in this case, to the auth service. So the
// auth service will have its own Axios Instance. The user service will have
// its own axios instance. Like that.
export let axiosAuthInstance: ReturnType<typeof axios.create>;

class AuthService {
  axiosService: AxiosService;

  constructor() {
    // This service name i.e the second argument in AxiosService i.e 'auth'
    // right here is what will be added as the `requestGatewayToken` in
    // axios.ts. So we add it as the id, and we sign and then append it or
    // add it to our headers. So `auth` here is service name.
    this.axiosService = new AxiosService(`${config.AUTH_BASE_URL}/api/v1/auth`, 'auth');
    // axiosCreateInstance returns an instance on axios.ts. And in that
    // instance property, we need the axios. This is why axios instance is
    // equal to this.axiosService.axios
    axiosAuthInstance = this.axiosService.axios;
  }
}

export const authService: AuthService = new AuthService();
