
import ts, {
    TransformationContext,
    Visitor,
    Node,
    Statement,
    NodeArray,
} from 'typescript';

const magicHookName = 'useDep';

const replaceMagicHookCall = (st: Statement): Statement => {
    if (ts.isVariableStatement(st)) {
        st.declarationList.declarations = ts.createNodeArray(st.declarationList.declarations.map(d => {
            if (d.initializer && ts.isCallExpression(d.initializer)) {
                let isMagicHook = false;
                try {
                    isMagicHook = d.initializer.expression.getText() === magicHookName;
                } catch (e) {
                    isMagicHook = false;
                }

                if (isMagicHook) {
                    const typeArgument = d.initializer.typeArguments?.[0];
                    if (!typeArgument) {
                        return d;
                    }
                    const typeParameter = typeArgument.getText().trim();
                    return ts.createVariableDeclaration(
                        d.name,
                        d.type,
                        ts.createCall(
                            ts.createIdentifier(magicHookName),
                            [],
                            [ts.createArrowFunction(
                                [],
                                [],
                                [ts.createParameter([], [], undefined, 'c')],
                                undefined,
                                undefined,
                                ts.createBlock([
                                    ts.createReturn(ts.createCall(
                                        ts.createPropertyAccess(
                                            ts.createIdentifier('c'),
                                            'get',
                                        ),
                                        [],
                                        [ts.createObjectLiteral([
                                            ts.createPropertyAssignment(
                                                "identifier",
                                                ts.createStringLiteral(typeParameter)
                                            ),
                                        ])]
                                    ))
                                ])
                            )]
                        ),
                    );
                }
            }
            return d;
        }));
    }
    return st;
}

const replaceStatements = (statements: NodeArray<Statement>): NodeArray<Statement> => {
    const result: Statement[] = [];
    for (const st of statements) {
        result.push(replaceMagicHookCall(st));
    }
    return ts.createNodeArray(result);
}

const transformer = (context: TransformationContext) => {
    const rootVisitor: Visitor = (node: Node) => {
        if (ts.isBlock(node)) {
            node.statements = replaceStatements(node.statements);
        }
        return ts.visitEachChild(node, rootVisitor, context);
    };
    return function (node: Node) { return ts.visitNode(node, rootVisitor); };
};

export default transformer;
