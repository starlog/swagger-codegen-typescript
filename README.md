This npm CLI tool generate various boilerplate files from your YAML to typescript. <br>
This will add jest test environment and eslint as well. All you need to do is creating your business logic! <br>

This npm includes 'swagger-codegen-cli.jar' from https://github.com/swagger-api/swagger-codegen. If you feel 
unsure, please download by yourself and replace with one from this npm.<br>  

How to install<br>

~~~
sudo npm install -global swagger-codegen-typescript
~~~


How to use<br>

Run command (or set alias/shell script)<br>
~~~
swagger-codegen-typescript ~/src/washswat-api-spec/specification/order/api-order-v1-ui-get-pickup-date-list.yaml ~/src/example
swagger-codegen-typescript gen (yaml file) (destination)
~~~
