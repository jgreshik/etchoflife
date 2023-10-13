{ pkgs ? import <nixpkgs> {}}:

pkgs.mkShell {
  buildInputs = with pkgs; [
    neovim
    vscodium
    nodejs
  ];

  shellHook = ''
    # codium extensions
    codium --install-extension dbaeumer.vscode-eslint
    codium --install-extension esbenp.prettier-vscode
    codium --install-extension ritwickdey.LiveServer
    codium --install-extension stylelint.vscode-stylelint
    codium --install-extension asvetliakov.vscode-neovim
  '';

}
