import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';

export interface WebAuthnCredential extends PublicKeyCredential {
  response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
}

export const isWebAuthnSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         'PublicKeyCredential' in window &&
         typeof navigator !== 'undefined' &&
         'credentials' in navigator;
};

export const createPasskey = async (
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<AuthenticatorAttestationResponse> => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  try {
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
      rp: options.rp,
      user: {
        id: Uint8Array.from(atob(options.user.id), (c) => c.charCodeAt(0)),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout,
      attestation: options.attestation,
      excludeCredentials: options.excludeCredentials?.map((cred) => ({
        id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        type: cred.type,
        transports: cred.transports,
      })),
      authenticatorSelection: options.authenticatorSelection,
      extensions: options.extensions,
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential & {
      response: AuthenticatorAttestationResponse;
    };

    if (!credential || !credential.response) {
      throw new Error('Failed to create passkey');
    }

    return credential.response;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Passkey creation was cancelled or not allowed');
    }
    if (error.name === 'InvalidStateError') {
      throw new Error('A passkey already exists for this account');
    }
    throw error;
  }
};

export const getPasskey = async (
  options: PublicKeyCredentialRequestOptionsJSON
): Promise<{ credential: PublicKeyCredential; response: AuthenticatorAssertionResponse }> => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  try {
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
      timeout: options.timeout,
      rpId: options.rpID,
      allowCredentials: options.allowCredentials?.map((cred) => ({
        id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        type: cred.type,
        transports: cred.transports,
      })),
      userVerification: options.userVerification,
      extensions: options.extensions,
    };

    const credential = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential & {
      response: AuthenticatorAssertionResponse;
    };

    if (!credential || !credential.response) {
      throw new Error('Failed to authenticate with passkey');
    }

    return { credential, response: credential.response };
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Passkey authentication was cancelled or not allowed');
    }
    throw error;
  }
};

export const convertAttestationResponse = (
  response: AuthenticatorAttestationResponse
): any => {
  return {
    id: btoa(
      String.fromCharCode(...new Uint8Array(response.getRawId()))
    ),
    rawId: btoa(
      String.fromCharCode(...new Uint8Array(response.getRawId()))
    ),
    response: {
      clientDataJSON: btoa(
        String.fromCharCode(...new Uint8Array(response.clientDataJSON))
      ),
      attestationObject: btoa(
        String.fromCharCode(...new Uint8Array(response.attestationObject))
      ),
    },
    type: 'public-key',
    clientExtensionResults: response.getClientExtensionResults(),
    authenticatorAttachment: response.getAuthenticatorAttachment?.() || null,
  };
};

export const convertAssertionResponse = (
  response: AuthenticatorAssertionResponse,
  credentialId: string
): any => {
  return {
    id: credentialId,
    rawId: btoa(
      String.fromCharCode(...new Uint8Array(response.getRawId()))
    ),
    response: {
      clientDataJSON: btoa(
        String.fromCharCode(...new Uint8Array(response.clientDataJSON))
      ),
      authenticatorData: btoa(
        String.fromCharCode(...new Uint8Array(response.authenticatorData))
      ),
      signature: btoa(
        String.fromCharCode(...new Uint8Array(response.signature))
      ),
      userHandle: response.userHandle
        ? btoa(String.fromCharCode(...new Uint8Array(response.userHandle)))
        : null,
    },
    type: 'public-key',
    clientExtensionResults: response.getClientExtensionResults(),
    authenticatorAttachment: response.getAuthenticatorAttachment?.() || null,
  };
};

