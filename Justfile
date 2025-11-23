build:
    docker build -t fundsui \
        --build-arg NEXT_PUBLIC_CONTRACT_ADDRESS=0x91cfb6a33730c817eda234a02ebd11c24da160256b175f7c52e7bb262769322e \
        --build-arg NEXT_PUBLIC_CHANNEL_REGISTRY=0x55c4d429477babbf3e479b1a9db24ffb2002329da2c8c2f3933874b4ec8ff0e1 \
        --build-arg NEXT_PUBLIC_CLIENT_ADDRESS=0x3041f60eafdb5351651dab5145c977e8e44b86eced6355eae2fd88af39ad6fbe \
        --build-arg NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space \
        --build-arg NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space \
        .

deploy-to-ecr:
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 857990087224.dkr.ecr.us-east-1.amazonaws.com
    docker tag fundsui:latest 857990087224.dkr.ecr.us-east-1.amazonaws.com/fundsui:latest
    docker push 857990087224.dkr.ecr.us-east-1.amazonaws.com/fundsui:latest
