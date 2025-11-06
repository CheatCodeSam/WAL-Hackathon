build:
    docker build -t fundsui --build-arg NEXT_PUBLIC_CLIENTVAR=clientvar .

deploy-to-ecr:
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 857990087224.dkr.ecr.us-east-1.amazonaws.com
    docker tag fundsui:latest 857990087224.dkr.ecr.us-east-1.amazonaws.com/fundsui:latest
    docker push 857990087224.dkr.ecr.us-east-1.amazonaws.com/fundsui:latest
