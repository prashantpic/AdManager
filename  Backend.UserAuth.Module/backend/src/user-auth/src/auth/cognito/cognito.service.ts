import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AttributeType,
   SignUpCommandOutput,
  ConfirmSignUpCommandOutput,
  InitiateAuthCommandOutput,
  RespondToAuthChallengeCommandOutput,
  ChallengeNameType,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';
import { UserAuthConfigService } from '../../config/user-auth.config';
import { CognitoConfig } from './cognito.config';


@Injectable()
export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private cognitoConfig: CognitoConfig;

  constructor(private readonly userAuthConfigService: UserAuthConfigService) {
    this.cognitoConfig = { // This should ideally come from UserAuthConfigService or a dedicated CognitoConfigService
        region: this.userAuthConfigService.getCognitoRegion(),
        userPoolId: this.userAuthConfigService.getCognitoUserPoolId(),
        clientId: this.userAuthConfigService.getCognitoClientId(),
    };

    if (!this.cognitoConfig.region || !this.cognitoConfig.userPoolId || !this.cognitoConfig.clientId) {
        console.warn('Cognito configuration is incomplete. CognitoService may not function.');
        // Potentially throw an error if Cognito is essential and not configured
        // For now, allow it to be optional.
        this.client = null; 
    } else {
        this.client = new CognitoIdentityProviderClient({ region: this.cognitoConfig.region });
    }
  }

  private ensureClient(): void {
    if (!this.client) {
        throw new InternalServerErrorException('CognitoService is not configured or initialized.');
    }
  }

  async signUp(email: string, password: string, attributes: AttributeType[] = []): Promise<SignUpCommandOutput> {
    this.ensureClient();
    const command = new SignUpCommand({
      ClientId: this.cognitoConfig.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        ...attributes,
      ],
    });

    try {
      return await this.client.send(command);
    } catch (error) {
      console.error('Cognito SignUp Error:', error);
      throw new BadRequestException(error.message || 'Cognito sign-up failed.');
    }
  }

  async confirmSignUp(email: string, code: string): Promise<ConfirmSignUpCommandOutput> {
    this.ensureClient();
    const command = new ConfirmSignUpCommand({
      ClientId: this.cognitoConfig.clientId,
      Username: email,
      ConfirmationCode: code,
    });

    try {
      return await this.client.send(command);
    } catch (error) {
      console.error('Cognito Confirm SignUp Error:', error);
      throw new BadRequestException(error.message || 'Cognito confirmation failed.');
    }
  }

  async initiateAuth(email: string, password: string): Promise<InitiateAuthCommandOutput> {
    this.ensureClient();
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH, // Or USER_SRP_AUTH for more security
      ClientId: this.cognitoConfig.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        // For SRP: SRP_A: '...'
      },
    });

    try {
      return await this.client.send(command);
    } catch (error) {
      console.error('Cognito InitiateAuth Error:', error);
      throw new BadRequestException(error.message || 'Cognito authentication initiation failed.');
    }
  }

  async respondToAuthChallenge(
    challengeName: ChallengeNameType,
    session: string,
    challengeResponses: Record<string, string>,
  ): Promise<RespondToAuthChallengeCommandOutput> {
    this.ensureClient();
    const command = new RespondToAuthChallengeCommand({
      ChallengeName: challengeName,
      ClientId: this.cognitoConfig.clientId,
      ChallengeResponses: challengeResponses,
      Session: session,
    });

    try {
      return await this.client.send(command);
    } catch (error) {
      console.error('Cognito RespondToAuthChallenge Error:', error);
      throw new BadRequestException(error.message || 'Cognito challenge response failed.');
    }
  }
}